import { buildPrompt } from "./promptBuilders";
import { validateContent, Candidate } from "./validators";
import { BrandProfile, Platform, PlatformConstraints } from "./config";
import { PostType } from "./templates";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { moderateContent } from "./moderation";

interface GenOpts {
  platform: Platform;
  postType: PostType;
  brand: BrandProfile;
  campaignTheme?: string;
  product?: string;
  desiredTone?: string;
  callToAction?: string;
  priorCaptions?: string[];
}

interface Score {
  overall: number;
  clarity: number;
  value: number;
  specificity: number;
  brandVoice: number;
  platformFit: number;
  actionability: number;
  feedback: string[];
}

export async function generateHighQualityPost(opts: GenOpts): Promise<{
  ok: true;
  best: Candidate;
  candidates: Candidate[];
  scores: Score[];
} | {
  ok: false;
  error: string;
  reasons: string[];
  coaching: string[];
}> {
  // 1) Build structured prompt
  const { system, user, constraints } = buildPrompt({
    platform: opts.platform,
    postType: opts.postType,
    brand: opts.brand,
    campaignTheme: opts.campaignTheme,
    product: opts.product,
    desiredTone: opts.desiredTone as any,
    callToAction: opts.callToAction
  });

  // 2) Generate N candidates with mild diversity
  const candidates = await generateCandidates(system, user);

  // 3) Critique & refine top 2
  const withScores = await Promise.all(
    candidates.map(async c => ({ c, score: await critique(c, opts.platform) }))
  );
  withScores.sort((a,b) => b.score.overall - a.score.overall);

  const refinedTop2 = await Promise.all(
    withScores.slice(0,2).map(async ({c,score}) => ({
      refined: await refine(c, score.feedback),
      preScore: score
    }))
  );
  const rescored = await Promise.all(
    refinedTop2.map(async (r) => ({ c: r.refined, score: await critique(r.refined, opts.platform) }))
  );
  rescored.sort((a,b) => b.score.overall - a.score.overall);

  // 4) Validate winner
  const winner = normalizeCandidate(rescored[0].c);
  const v = validateContent(
    winner,
    { 
      maxChars: constraints.maxChars, 
      maxHashtags: constraints.maxHashtags, 
      allowedRatios: ["1:1"], 
      readabilityMaxGrade: constraints.readabilityMaxGrade 
    },
    opts.priorCaptions || []
  );
  
  if (!v.ok) {
    // one auto-fix attempt: shorten & tighten
    const fixed = await tighten(winner, v.reasons);
    const v2 = validateContent(fixed, { 
      maxChars: constraints.maxChars, 
      maxHashtags: constraints.maxHashtags, 
      allowedRatios: ["1:1"], 
      readabilityMaxGrade: constraints.readabilityMaxGrade 
    }, opts.priorCaptions || []);
    
    if (!v2.ok) {
      return { 
        ok: false, 
        error: "validation_failed", 
        reasons: v2.reasons, 
        coaching: v2.coaching 
      };
    }
    
    // Safety check on fixed content
    const safety = await moderateContent(
      fixed.caption + '\n' + fixed.hashtags.join(' '), 
      opts.platform
    );
    
    if (safety.decision === "block") {
      return {
        ok: false,
        error: "content_policy_violation",
        reasons: safety.reasons,
        coaching: safety.coaching || []
      };
    }
    
    return { 
      ok: true, 
      best: fixed, 
      candidates: candidates.map(normalizeCandidate), 
      scores: rescored.map(s=>s.score),
      requiresReview: safety.decision === "review"
    };
  }
  
  // 5) Safety moderation
  const fullContent = winner.caption + '\n' + winner.hashtags.join(' ');
  const safety = await moderateContent(fullContent, opts.platform);
  
  if (safety.decision === "block") {
    // Try safe rewrite if available
    if (safety.safeRewrite) {
      const safeCandidate = normalizeCandidate(safety.safeRewrite);
      return {
        ok: true,
        best: safeCandidate,
        candidates: candidates.map(normalizeCandidate),
        scores: rescored.map(s=>s.score),
        wasRewritten: true,
        requiresReview: true
      };
    }
    
    return {
      ok: false,
      error: "content_policy_violation",
      reasons: safety.reasons,
      coaching: safety.coaching || []
    };
  }

  return { 
    ok: true, 
    best: winner, 
    candidates: candidates.map(normalizeCandidate), 
    scores: rescored.map(s=>s.score),
    requiresReview: safety.decision === "review"
  };
}

// --- helpers ---

async function generateCandidates(system: string, user: string): Promise<string[]> {
  const temps = [0.6, 0.7, 0.8];
  const outs: string[] = [];
  
  const ai = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;
  
  if (!ai) {
    // Fallback to simple generation
    return [
      `🚀 Transform your business with smart automation! Our AI-powered tools help you save 5+ hours weekly on repetitive tasks. Start your free trial today and see results in 24 hours.\n\n#SmartAutomation #BusinessGrowth #Productivity #AITools #TimeSaver\n\nCTA: Start Free Trial`,
      `💡 Did you know? 73% of businesses using AI report increased productivity. Join thousands who've already automated their workflow. Get instant access to our platform.\n\n#BusinessAutomation #ProductivityHack #AIBusiness #WorkSmarter #TechSolution\n\nCTA: Get Started Now`,
      `📈 Ready to scale? Our platform helped 500+ businesses grow 3x faster. Discover how AI can transform your operations. Limited spots available this month!\n\n#BusinessScaling #GrowthStrategy #AITransformation #StartupSuccess #Innovation\n\nCTA: Book Your Demo`
    ];
  }
  
  for (const t of temps) {
    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: [system, user].join("\n\n") }] }],
        generationConfig: { temperature: t, maxOutputTokens: 250 }
      });
      const response = result.response;
      const text = response.text();
      outs.push(clean(text));
    } catch (error) {
      console.error("Generation error:", error);
      // Add fallback
      outs.push(`Discover how our solution can help your business grow. Contact us today!\n\n#Business #Growth #Solution\n\nCTA: Learn More`);
    }
  }
  return outs;
}

function normalizeCandidate(text: string): Candidate {
  const lines = text.split('\n').filter(Boolean);
  const hashtags = extractHashtags(text);
  const cta = extractCTA(text);
  const caption = lines.find(l => !l.startsWith('#') && !l.startsWith('CTA:')) || text;
  
  return { caption: cleanCaption(caption), hashtags, cta };
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g) || [];
  return matches.slice(0, 5).map(tag => tag.toLowerCase());
}

function extractCTA(text: string): string {
  const ctaMatch = text.match(/CTA:\s*(.+)$/im);
  if (ctaMatch) return ctaMatch[1].trim();
  
  // Try to infer from common patterns
  const patterns = [
    /(?:call|contact|visit|shop|book|start|get|try|learn|discover|explore)\s+(?:now|today|here)/gi,
    /(?:link in bio|swipe up|tap here|click here)/gi
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  
  return "Learn more";
}

function cleanCaption(text: string): string {
  return text
    .replace(/#[\w]+/g, '')
    .replace(/CTA:.*/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function critique(candidate: string, platform: Platform): Promise<Score> {
  // Simple scoring heuristic
  const c = normalizeCandidate(candidate);
  const scores = {
    clarity: scoreClarity(c.caption),
    value: scoreValue(c.caption),
    specificity: scoreSpecificity(c.caption),
    brandVoice: 0.7, // Would need brand analysis
    platformFit: scorePlatformFit(c, platform),
    actionability: c.cta ? 0.8 : 0.3
  };
  
  const overall = Object.values(scores).reduce((a,b) => a+b, 0) / Object.keys(scores).length;
  
  const feedback: string[] = [];
  if (scores.clarity < 0.6) feedback.push("Simplify sentence structure");
  if (scores.value < 0.6) feedback.push("Add specific benefit or proof");
  if (scores.actionability < 0.6) feedback.push("Include clear call-to-action");
  
  return { overall, ...scores, feedback };
}

function scoreClarity(text: string): number {
  const avgWordLength = text.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / text.split(/\s+/).length;
  const sentenceCount = (text.match(/[.!?]/g) || []).length || 1;
  const wordsPerSentence = text.split(/\s+/).length / sentenceCount;
  
  // Lower is clearer
  const clarityScore = 1 - Math.min(1, (avgWordLength / 10 + wordsPerSentence / 30) / 2);
  return Math.max(0.3, clarityScore);
}

function scoreValue(text: string): number {
  const valueWords = /save|increase|boost|improve|transform|grow|reduce|eliminate|achieve|unlock/gi;
  const matches = (text.match(valueWords) || []).length;
  return Math.min(1, 0.5 + matches * 0.2);
}

function scoreSpecificity(text: string): number {
  const specificWords = /\d+|percent|hours|minutes|days|weeks|months|dollars|customers|users|businesses/gi;
  const matches = (text.match(specificWords) || []).length;
  return Math.min(1, 0.5 + matches * 0.25);
}

function scorePlatformFit(c: Candidate, platform: Platform): number {
  const constraints = PLATFORM_CONSTRAINTS[platform];
  let score = 1.0;
  
  if (c.caption.length > constraints.maxChars) score -= 0.3;
  if (c.hashtags.length > constraints.maxHashtags) score -= 0.2;
  if (c.hashtags.length < 3) score -= 0.2;
  
  return Math.max(0.3, score);
}

async function refine(candidate: string, feedback: string[]): Promise<string> {
  if (feedback.length === 0) return candidate;
  
  const c = normalizeCandidate(candidate);
  let refined = c.caption;
  
  for (const f of feedback) {
    if (f.includes("Simplify")) {
      refined = simplifyText(refined);
    }
    if (f.includes("specific benefit")) {
      refined = addSpecificity(refined);
    }
    if (f.includes("call-to-action") && !c.cta) {
      refined += "\n\nCTA: Get Started Today";
    }
  }
  
  return `${refined}\n\n${c.hashtags.join(' ')}\n\n${c.cta ? `CTA: ${c.cta}` : ''}`;
}

function simplifyText(text: string): string {
  return text
    .replace(/utilize/gi, 'use')
    .replace(/implement/gi, 'start')
    .replace(/leverage/gi, 'use')
    .replace(/optimize/gi, 'improve');
}

function addSpecificity(text: string): string {
  if (!text.includes('%') && !text.match(/\d+/)) {
    return text.replace('improve', 'improve by 40%')
      .replace('save time', 'save 5+ hours weekly')
      .replace('grow', 'grow 3x faster');
  }
  return text;
}

async function tighten(c: Candidate, reasons: string[]): Promise<Candidate> {
  let fixed = { ...c };
  
  if (reasons.includes("caption.too_long")) {
    // Remove filler words and shorten
    fixed.caption = fixed.caption
      .replace(/\b(very|really|just|actually|basically|literally)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If still too long, truncate smartly at sentence boundary
    const constraints = PLATFORM_CONSTRAINTS["x"]; // Use shortest as example
    if (fixed.caption.length > constraints.maxChars) {
      const sentences = fixed.caption.split(/[.!?]/);
      fixed.caption = sentences[0] + '.';
    }
  }
  
  if (reasons.includes("hashtags.count")) {
    // Ensure 3-5 hashtags
    if (fixed.hashtags.length < 3) {
      fixed.hashtags.push('#innovation', '#businessgrowth', '#efficiency');
    }
    if (fixed.hashtags.length > 5) {
      fixed.hashtags = fixed.hashtags.slice(0, 5);
    }
  }
  
  if (reasons.includes("cta.missing")) {
    fixed.cta = "Learn More";
  }
  
  return fixed;
}

function clean(text: string): string {
  return text.trim().replace(/\n{3,}/g, '\n\n');
}

import { PLATFORM_CONSTRAINTS } from "./config";