import { Platform, BrandProfile, Tone } from "./config";
import { PostType } from "./templates";

// Professional expertise system prompts
export const PROFESSIONAL_EXPERTISE_PROMPTS = {
  viral: `You are an elite social media strategist with:
- 10+ years creating viral content with 10M+ reach track record
- Deep understanding of platform algorithms and psychological engagement triggers
- Expertise in conversion-focused copywriting and brand voice consistency
- Data from 10,000+ successful posts across all major platforms`,

  industry: {
    fashion: "Fashion industry expertise: Vogue-level editorial knowledge, trend forecasting abilities, influencer marketing mastery, visual storytelling specialist",
    food: "Food & beverage expertise: Michelin-star presentation knowledge, food photography specialist, culinary trend expert, appetite appeal psychology",
    tech: "Technology expertise: Silicon Valley insider knowledge, product launch specialist, technical concepts simplification expert, innovation storytelling",
    fitness: "Fitness & wellness expertise: Certified trainer knowledge, transformation psychology, motivation specialist, health trend authority",
    beauty: "Beauty industry expertise: Skincare science knowledge, makeup artistry background, ingredient expertise, self-care psychology specialist",
    realEstate: "Real estate expertise: Luxury property specialist, architectural knowledge, lifestyle selling expert, investment opportunity framing",
    automotive: "Automotive expertise: Performance engineering knowledge, lifestyle branding specialist, luxury positioning expert, technical feature storytelling",
    ecommerce: "E-commerce expertise: Conversion optimization specialist, product positioning expert, urgency creation master, social proof strategist",
    professional: "B2B expertise: LinkedIn thought leadership, industry authority positioning, executive communication, ROI-focused messaging",
    healthcare: "Healthcare expertise: Medical communication specialist, patient engagement expert, trust-building authority, compliance-aware messaging"
  }
};

// Enhanced engagement formulas for variety
export const CONTENT_FORMULAS = {
  hook: {
    name: "Hook Formula",
    structure: "Surprising fact/stat → Problem it reveals → Solution teaser → Social proof → CTA",
    template: "Did you know that [surprising stat]? This reveals [problem]. Here's how [solution teaser]. [Number] businesses already [achievement]. [CTA]",
    example: "Did you know 73% of customers abandon carts due to shipping costs? This reveals a pricing transparency issue. Here's how smart pricing displays fix it. 2,400+ stores already increased conversions by 34%. See how →"
  },

  problemAgitate: {
    name: "Problem-Agitate-Solution",
    structure: "Identify problem → Agitate pain points → Present solution → Benefits → CTA",
    template: "Struggling with [problem]? It's costing you [consequences]. Every day without [solution], you're losing [opportunity]. Our [product] helps you [benefit]. [CTA]",
    example: "Struggling with content creation? It's costing you engagement and sales. Every day without consistent posts, competitors steal your audience. Our AI helps you create 30 days of content in 30 minutes. Start free →"
  },

  transformation: {
    name: "Before-After-Bridge",
    structure: "Before state → After state → Bridge (how to get there) → Proof → CTA",
    template: "From [before state] to [after state] in just [timeframe]. The bridge? [Solution]. [Customer type] achieved [specific result]. Your transformation starts with [CTA]",
    example: "From 5 leads/month to 50 leads/week in just 30 days. The bridge? Our automated outreach system. Sarah's agency achieved 10x growth using this exact method. Your transformation starts here →"
  },

  socialProof: {
    name: "Social Proof Stack",
    structure: "Number proof → Authority endorsement → Customer success → Results → CTA",
    template: "[Number] [customers] trust us. Featured in [authority]. '[Testimonial quote]' - [Customer]. Average result: [metric]. Join them: [CTA]",
    example: "10,000+ marketers trust us. Featured in Forbes & TechCrunch. 'Doubled our ROI in 60 days' - Nike Digital Team. Average result: 3.5x ROAS. Join them today →"
  },

  mythBuster: {
    name: "Myth Buster",
    structure: "Common belief → Why it's wrong → Truth → Evidence → New approach",
    template: "MYTH: [common belief]. REALITY: [truth]. Studies show [evidence]. Stop [old way] and start [new way]. [CTA]",
    example: "MYTH: You need 10k followers to monetize. REALITY: Micro-influencers earn more per follower. Studies show 2-5k accounts have 6x higher engagement. Stop chasing vanity metrics, start building community →"
  },

  behindScenes: {
    name: "Behind The Scenes",
    structure: "Insider access → Process reveal → Authenticity → Learning → Connection",
    template: "Behind the scenes: How we [process]. Step 1: [detail]. The secret? [insight]. Most people don't know [insider tip]. See the full process: [CTA]",
    example: "Behind the scenes: How we grew to $1M ARR. Step 1: Obsessive customer research. The secret? We talk to 5 users daily. Most don't know this drives 80% of our growth. See our playbook →"
  },

  customerStory: {
    name: "Customer Success Story",
    structure: "Customer context → Challenge → Solution → Results → Relatability",
    template: "Meet [customer]: [context]. Challenge: [problem]. Solution: [how we helped]. Result: [specific outcome]. Your story could be next: [CTA]",
    example: "Meet Jane: Boutique owner with stagnant sales. Challenge: No online presence. Solution: Our social commerce platform. Result: $50k in new revenue in 90 days. Your success story starts here →"
  },

  quickWin: {
    name: "Quick Win",
    structure: "Time promise → Specific tactic → Implementation → Result → Expand",
    template: "[Time] hack: [Specific tactic]. How: [Simple steps]. Result: [Immediate benefit]. This is just one of [number] strategies. Get all: [CTA]",
    example: "5-minute hack: Use 'because' to increase conversions 34%. How: Add reason after any request. Result: Higher compliance rate (Harvard study). This is just one of 47 psychology tricks. Get all →"
  },

  comparison: {
    name: "Us vs Them",
    structure: "Old way problems → New way benefits → Direct comparison → Winner → Switch",
    template: "Old way: [traditional method] ([problems]). New way: [your solution] ([benefits]). The difference? [key distinction]. Smart choice: [CTA]",
    example: "Old way: Manual posting (2 hours daily, inconsistent). New way: AI automation (5 minutes setup, always on-brand). The difference? You focus on strategy, not tasks. Make the switch →"
  },

  urgency: {
    name: "Limited Time",
    structure: "Scarcity → Value → Deadline → Consequence → Action",
    template: "Only [number] [spots/items] left. Worth [value]. Ends [deadline]. Miss this = [consequence]. Secure yours: [CTA]",
    example: "Only 10 early-bird spots left. Worth $2,000 in bonuses. Ends midnight Sunday. Miss this = paying full price next month. Secure your spot now →"
  },

  education: {
    name: "Educational Value",
    structure: "Promise → Teach → Framework → Application → Deeper dive",
    template: "How to [achieve outcome]: The [method name] framework. Step 1: [instruction]. Key insight: [learning]. Master this with our full guide: [CTA]",
    example: "How to write viral hooks: The AIDA framework. Step 1: Grab Attention with controversy or curiosity. Key insight: First 3 words determine 80% of engagement. Master this with our Copywriting Bible →"
  },

  controversy: {
    name: "Controversial Take",
    structure: "Bold statement → Challenge status quo → Evidence → New perspective → Debate",
    template: "Unpopular opinion: [controversial statement]. While everyone [common practice], we [different approach]. Data: [proof]. Ready to think differently? [CTA]",
    example: "Unpopular opinion: SEO is dying. While everyone chases keywords, we're building communities. Data: 70% of our traffic is direct/social. Ready to future-proof your marketing? →"
  },

  prediction: {
    name: "Future Forecast",
    structure: "Future state → Timeline → Indicators → Preparation → First-mover advantage",
    template: "By [year], [prediction]. Early signs: [indicators]. Prepare now: [action steps]. Be ahead of 99%: [CTA]",
    example: "By 2025, AI will handle 80% of customer service. Early signs: ChatGPT adoption up 400%. Prepare now: Train your AI assistant. Be ahead of 99% of competitors →"
  },

  checklist: {
    name: "Checklist Audit",
    structure: "List items → Self-assessment → Gaps → Solutions → Complete system",
    template: "✓ [item 1] ✓ [item 2] ✗ [item 3] ✗ [item 4]. Missing any? You're leaving [opportunity] on the table. Complete your setup: [CTA]",
    example: "✓ Email list ✓ Social presence ✗ Automation ✗ Analytics. Missing any? You're leaving 50% revenue on the table. Complete your marketing stack →"
  }
};

// Platform-specific optimization rules
export const PLATFORM_OPTIMIZATION = {
  instagram: {
    algorithm: "Prioritizes: Reels, carousel posts, Stories engagement, saves > likes, first 30-min performance",
    hooks: ["Save this for later", "You need to see this", "Wait for it...", "POV:", "Things that live rent-free"],
    formatting: "Line breaks every 125 chars, emoji at line starts, carousel cliffhangers",
    bestPractices: "Post when audience active, respond to comments <2hrs, use all 30 hashtags strategically"
  },

  facebook: {
    algorithm: "Prioritizes: Native video, meaningful interactions, Groups, live video, friend/family content",
    hooks: ["Can you relate?", "This made my day", "I can't be the only one who", "Thoughts?", "Who else"],
    formatting: "Short paragraphs, conversational tone, question at end, shareable content",
    bestPractices: "Spark discussions, use Facebook-specific features, optimize for shares not likes"
  },

  x: {
    algorithm: "Prioritizes: Reply threads, quote tweets, breaking news, real-time engagement",
    hooks: ["Thread:", "Hot take:", "Breaking:", "Unpopular opinion:", "A quick story:"],
    formatting: "Thread numbers (1/5), line breaks for readability, strategic hashtag placement",
    bestPractices: "Tweet at peak times, engage with replies, use trending hashtags wisely"
  },

  linkedin: {
    algorithm: "Prioritizes: Dwell time, professional content, native documents, employee advocacy",
    hooks: ["I learned something valuable today", "After 10 years in [industry]", "Controversial career advice:", "The mistake that taught me"],
    formatting: "Short paragraphs, professional but personal, insights over promotion",
    bestPractices: "Post Tuesday-Thursday mornings, use native video, engage meaningfully"
  },

  tiktok: {
    algorithm: "Prioritizes: Watch time %, replays, shares, comments, completion rate",
    hooks: ["Wait til the end", "POV", "Things in my [X] that just make sense", "Rating [X] until", "Day [X] of"],
    formatting: "Hook in first 3 seconds, trend-based content, native features usage",
    bestPractices: "Post 3-5x daily, use trending sounds, engage with comments via video replies"
  }
};

// Emotional trigger mapping
export const EMOTIONAL_TRIGGERS = {
  curiosity: {
    triggers: ["secret", "revealed", "nobody talks about", "hidden", "discovered", "shocking truth"],
    application: "Use for educational content, behind-scenes, myth-busting"
  },

  fomo: {
    triggers: ["limited time", "only X left", "before it's gone", "exclusive", "members only", "ends soon"],
    application: "Use for promotions, launches, time-sensitive offers"
  },

  aspiration: {
    triggers: ["dream", "achieve", "success story", "transformation", "your best", "unlock potential"],
    application: "Use for testimonials, case studies, motivational content"
  },

  belonging: {
    triggers: ["join us", "community", "you're not alone", "others like you", "part of something"],
    application: "Use for community building, user-generated content campaigns"
  },

  security: {
    triggers: ["protect", "safe", "trusted by", "guaranteed", "proven", "risk-free"],
    application: "Use for trust-building, testimonials, guarantee announcements"
  },

  achievement: {
    triggers: ["master", "win", "accomplish", "conquer", "succeed", "level up"],
    application: "Use for tutorials, challenges, skill-building content"
  }
};

// Industry-specific terminology
export const INDUSTRY_TERMINOLOGY = {
  fashion: ["capsule collection", "drop", "lookbook", "street style", "haute couture", "ready-to-wear", "sustainable fashion", "fast fashion", "upcycled"],

  food: ["farm-to-table", "artisanal", "small-batch", "locally sourced", "craft", "fusion", "gastropub", "molecular", "seasonal menu"],

  tech: ["disruptive", "scalable", "API", "SaaS", "integration", "automation", "AI-powered", "cloud-native", "blockchain", "machine learning"],

  fitness: ["HIIT", "functional training", "macros", "progressive overload", "mind-muscle connection", "recovery", "periodization", "form", "PR"],

  beauty: ["clean beauty", "K-beauty", "glass skin", "no-makeup makeup", "contouring", "sustainable packaging", "cruelty-free", "vegan", "clinical-grade"],

  realEstate: ["turnkey", "ROI", "cap rate", "curb appeal", "open concept", "walkable", "up-and-coming", "move-in ready", "smart home"],

  automotive: ["performance", "torque", "handling", "fuel efficiency", "safety rating", "infotainment", "autonomous", "electric range", "horsepower"]
};

// Enhanced prompt builder
export function buildEnhancedPrompt(params: {
  platform: Platform;
  postType: PostType;
  brand: BrandProfile;
  formula?: keyof typeof CONTENT_FORMULAS;
  industry?: string;
  emotionalTrigger?: keyof typeof EMOTIONAL_TRIGGERS;
  campaignTheme?: string;
  product?: string;
  desiredTone?: Tone;
  callToAction?: string;
  priorCaptions?: string[];
}): { system: string; user: string; constraints: any } {

  // Select formula (rotate through them for variety)
  const formulaKey = params.formula || 'hook';
  const formula = CONTENT_FORMULAS[formulaKey];

  // Get platform-specific optimization
  const platformOpt = PLATFORM_OPTIMIZATION[params.platform as keyof typeof PLATFORM_OPTIMIZATION];

  // Get industry expertise if applicable
  const industryExpertise = params.industry
    ? PROFESSIONAL_EXPERTISE_PROMPTS.industry[params.industry as keyof typeof PROFESSIONAL_EXPERTISE_PROMPTS.industry]
    : "";

  // Get emotional triggers
  const emotionalTrigger = params.emotionalTrigger
    ? EMOTIONAL_TRIGGERS[params.emotionalTrigger]
    : EMOTIONAL_TRIGGERS.curiosity;

  // Build enhanced system prompt
  const system = `${PROFESSIONAL_EXPERTISE_PROMPTS.viral}

${industryExpertise}

Platform Expertise for ${params.platform}:
${platformOpt ? `Algorithm optimization: ${platformOpt.algorithm}
Best hooks: ${platformOpt.hooks.join(', ')}
Formatting: ${platformOpt.formatting}` : ''}

Your content MUST:
1. Hook readers within first 3 words using ${params.platform}-optimized hooks
2. Use ${formula.name} structure: ${formula.structure}
3. Include ${emotionalTrigger.triggers.join(' or ')} for emotional engagement
4. Maintain readability at 5th-8th grade level
5. End with clear, action-oriented CTA
6. Use pattern interrupts every 2-3 lines
7. Include platform-specific engagement elements

Brand voice: ${params.desiredTone || params.brand.voice || 'professional yet approachable'}
Target audience: ${params.brand.targetAudience || 'engaged social media users'}`;

  // Build enhanced user prompt with variety
  const avoidPhrases = params.priorCaptions
    ? `\n\nAVOID these phrases/patterns from previous posts:\n${params.priorCaptions.slice(-3).map(c => `- ${c.substring(0, 50)}...`).join('\n')}`
    : "";

  const user = `Create a ${params.platform} post for ${params.brand.brandName}.

Content Formula: ${formula.template}
Post Type: ${params.postType}
${params.campaignTheme ? `Campaign Theme: ${params.campaignTheme}` : ''}
${params.product ? `Featured Product/Service: ${params.product}` : ''}

Key Requirements:
- Start with one of these hooks: ${platformOpt?.hooks.slice(0, 3).join(', ')}
- Apply ${formula.name}: ${formula.example}
- Include emotional triggers: ${emotionalTrigger.triggers.slice(0, 3).join(', ')}
- Value propositions: ${params.brand.valueProps?.join(', ') || 'clear benefits'}
- Call-to-action: ${params.callToAction || params.brand.preferredCTAs?.[0] || 'Learn more'}

Platform-specific requirements:
- Character limit: Follow ${params.platform} constraints
- Hashtags: 3-5 niche, relevant tags (no generic tags like #business)
- Format: ${platformOpt?.formatting}

Industry terminology to include naturally: ${params.industry ? INDUSTRY_TERMINOLOGY[params.industry as keyof typeof INDUSTRY_TERMINOLOGY]?.slice(0, 3).join(', ') : 'professional terms'}

${avoidPhrases}

Output format:
[Hook + Main Content]

[Hashtags on new line]

CTA: [Clear action phrase]`;

  const constraints = {
    maxChars: params.platform === 'x' ? 260 : params.platform === 'linkedin' ? 3000 : 2200,
    maxHashtags: 5,
    readabilityMaxGrade: 8
  };

  return { system, user, constraints };
}

// Helper to get next formula for variety
export function getNextFormula(index: number): keyof typeof CONTENT_FORMULAS {
  const formulas = Object.keys(CONTENT_FORMULAS) as Array<keyof typeof CONTENT_FORMULAS>;
  return formulas[index % formulas.length];
}

// Helper to detect industry from brand/product context
export function detectIndustry(brand: BrandProfile, product?: string): string {
  const context = `${brand.brandName} ${product} ${brand.products?.join(' ')} ${brand.keywords?.join(' ')}`.toLowerCase();

  if (/fashion|clothing|apparel|style|outfit|wardrobe/.test(context)) return 'fashion';
  if (/food|restaurant|cafe|dining|cuisine|chef|meal/.test(context)) return 'food';
  if (/tech|software|app|saas|platform|digital|ai|automation/.test(context)) return 'tech';
  if (/fitness|gym|workout|training|health|wellness|nutrition/.test(context)) return 'fitness';
  if (/beauty|skincare|makeup|cosmetic|spa|salon/.test(context)) return 'beauty';
  if (/real estate|property|home|house|apartment|realty/.test(context)) return 'realEstate';
  if (/car|auto|vehicle|driving|automotive/.test(context)) return 'automotive';
  if (/ecommerce|shop|store|retail|product/.test(context)) return 'ecommerce';
  if (/medical|doctor|clinic|health|patient|therapy/.test(context)) return 'healthcare';

  return 'professional'; // Default to B2B/professional
}

// Helper to select emotional trigger based on post type
export function selectEmotionalTrigger(postType: PostType): keyof typeof EMOTIONAL_TRIGGERS {
  const triggerMap: Record<PostType, keyof typeof EMOTIONAL_TRIGGERS> = {
    promo: 'fomo',
    announcement: 'curiosity',
    tutorial: 'achievement',
    testimonial: 'aspiration',
    faq: 'security',
    event: 'belonging',
    seasonal: 'fomo'
  };

  return triggerMap[postType] || 'curiosity';
}