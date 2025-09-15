import { GoogleGenAI } from "@google/genai";

export type ModerationDecision = "allow" | "review" | "block";

export interface ModerationResult {
  decision: ModerationDecision;
  reasons: string[];
  coaching?: string[];
  safeRewrite?: string;
  confidence: number;
}

// Platform-specific policy restrictions
const PLATFORM_POLICIES = {
  instagram: {
    prohibited: ["violence", "hate_speech", "adult_content", "misleading_claims", "regulated_goods"],
    sensitive: ["political", "medical_claims", "financial_advice"],
    maxHashtags: 30,
  },
  facebook: {
    prohibited: ["violence", "hate_speech", "adult_content", "misinformation", "spam"],
    sensitive: ["political", "medical_claims", "financial_products"],
    maxHashtags: 30,
  },
  x: {
    prohibited: ["violence", "hate_speech", "adult_content", "private_info"],
    sensitive: ["political", "misleading"],
    maxHashtags: 10,
  },
  linkedin: {
    prohibited: ["inappropriate_content", "harassment", "spam", "fake_profiles"],
    sensitive: ["controversial_topics", "unverified_claims"],
    maxHashtags: 5,
  },
  tiktok: {
    prohibited: ["dangerous_acts", "hate_speech", "adult_content", "harmful_misinformation"],
    sensitive: ["political", "medical_advice", "financial_advice"],
    maxHashtags: 100,
  }
};

// Known problematic terms that should trigger review
const REVIEW_TRIGGERS = [
  /\b(cure|treatment|heal|medical|doctor|prescription|fda|approved)\b/gi,
  /\b(guarantee|promise|assured|definitely|100%|risk-free)\b/gi,
  /\b(limited time|act now|don't wait|last chance|expires)\b/gi,
  /\b(make money|get rich|passive income|financial freedom)\b/gi,
  /\b(weight loss|diet|supplement|miracle|breakthrough)\b/gi,
];

// Terms that should be immediately blocked
const BLOCK_TRIGGERS = [
  /\b(kill|suicide|self-harm|violence|weapon)\b/gi,
  /\b(hate|racist|sexist|discriminate)\b/gi,
  /\b(nude|porn|sex|explicit)\b/gi,
  /\b(scam|fraud|illegal|stolen)\b/gi,
  /\b(drug|cocaine|marijuana|pills)\b/gi,
];

/**
 * Pre-generation safety check for prompts
 */
export async function checkPromptSafety(
  prompt: string,
  kind: "text" | "image" | "video"
): Promise<ModerationResult> {
  // Quick regex checks first
  for (const pattern of BLOCK_TRIGGERS) {
    if (pattern.test(prompt)) {
      return {
        decision: "block",
        reasons: ["prohibited_content"],
        coaching: ["This prompt contains prohibited terms. Please rephrase without harmful content."],
        confidence: 1.0
      };
    }
  }

  for (const pattern of REVIEW_TRIGGERS) {
    if (pattern.test(prompt)) {
      return {
        decision: "review",
        reasons: ["sensitive_content"],
        coaching: ["This content may require review. Consider rephrasing claims to be more factual."],
        confidence: 0.7
      };
    }
  }

  // For images/video, check for inappropriate visual requests
  if (kind !== "text") {
    const visualProblems = checkVisualPrompt(prompt);
    if (visualProblems.length > 0) {
      return {
        decision: "block",
        reasons: visualProblems,
        coaching: ["Visual content must be appropriate for all audiences."],
        confidence: 0.9
      };
    }
  }

  return {
    decision: "allow",
    reasons: [],
    confidence: 1.0
  };
}

/**
 * Post-generation content moderation
 */
export async function moderateContent(
  content: string,
  platform: keyof typeof PLATFORM_POLICIES,
  isAd: boolean = false
): Promise<ModerationResult> {
  const policy = PLATFORM_POLICIES[platform];
  
  // Check for prohibited content
  for (const pattern of BLOCK_TRIGGERS) {
    if (pattern.test(content)) {
      return {
        decision: "block",
        reasons: ["prohibited_content", "policy_violation"],
        coaching: [
          "Content contains prohibited terms.",
          "Please create content that's safe for all audiences."
        ],
        safeRewrite: generateSafeAlternative(content),
        confidence: 1.0
      };
    }
  }

  // Check for sensitive content that needs review
  let reviewReasons: string[] = [];
  for (const pattern of REVIEW_TRIGGERS) {
    if (pattern.test(content)) {
      reviewReasons.push("sensitive_content");
      break;
    }
  }

  // Ad-specific checks
  if (isAd) {
    if (/\b(guarantee|promise|100%|no risk)\b/gi.test(content)) {
      reviewReasons.push("unsubstantiated_claims");
    }
    if (!/\#ad|\#sponsored|\#partner/gi.test(content)) {
      reviewReasons.push("missing_disclosure");
    }
  }

  // Platform-specific hashtag limits
  const hashtags = (content.match(/#\w+/g) || []).length;
  if (hashtags > policy.maxHashtags) {
    reviewReasons.push("excessive_hashtags");
  }

  if (reviewReasons.length > 0) {
    return {
      decision: "review",
      reasons: reviewReasons,
      coaching: generateCoaching(reviewReasons),
      safeRewrite: isAd ? addRequiredDisclosures(content) : undefined,
      confidence: 0.6
    };
  }

  return {
    decision: "allow",
    reasons: [],
    confidence: 0.95
  };
}

/**
 * Pre-publish final safety gate
 */
export async function prePublishCheck(
  content: string,
  mediaUrls: string[],
  platform: keyof typeof PLATFORM_POLICIES
): Promise<ModerationResult> {
  // Run content moderation
  const contentCheck = await moderateContent(content, platform);
  if (contentCheck.decision === "block") {
    return contentCheck;
  }

  // Check if media needs review (would need actual image analysis in production)
  // For now, just flag if there are media items and content has sensitive topics
  if (mediaUrls.length > 0 && contentCheck.decision === "review") {
    return {
      ...contentCheck,
      coaching: [
        ...contentCheck.coaching || [],
        "Media content should be reviewed before publishing."
      ]
    };
  }

  return contentCheck;
}

// Helper functions

function checkVisualPrompt(prompt: string): string[] {
  const problems: string[] = [];
  
  const inappropriate = [
    /\b(nude|naked|explicit|sexual)\b/gi,
    /\b(violence|blood|gore|death)\b/gi,
    /\b(child|minor|kid).*\b(inappropriate|dangerous)\b/gi,
  ];

  for (const pattern of inappropriate) {
    if (pattern.test(prompt)) {
      problems.push("inappropriate_visual_request");
    }
  }

  return problems;
}

function generateSafeAlternative(content: string): string {
  // Simple safe rewrite - in production, use AI for better rewrites
  let safe = content;
  
  // Remove problematic words
  BLOCK_TRIGGERS.forEach(pattern => {
    safe = safe.replace(pattern, "[removed]");
  });
  
  // Remove excessive claims
  safe = safe.replace(/\b(guarantee|promise|100%|assured)\b/gi, "aim to");
  safe = safe.replace(/\b(cure|heal)\b/gi, "support");
  safe = safe.replace(/\b(proven|scientific fact)\b/gi, "researched");
  
  return safe;
}

function generateCoaching(reasons: string[]): string[] {
  const coaching: string[] = [];
  
  if (reasons.includes("sensitive_content")) {
    coaching.push("Content touches on sensitive topics. Ensure claims are factual and substantiated.");
  }
  if (reasons.includes("unsubstantiated_claims")) {
    coaching.push("Avoid absolute guarantees. Use 'may help' or 'designed to' instead.");
  }
  if (reasons.includes("missing_disclosure")) {
    coaching.push("Add #ad or #sponsored to comply with advertising guidelines.");
  }
  if (reasons.includes("excessive_hashtags")) {
    coaching.push("Reduce hashtag count to platform limits for better reach.");
  }
  
  return coaching;
}

function addRequiredDisclosures(content: string): string {
  if (!/#ad|#sponsored|#partner/gi.test(content)) {
    return content + "\n\n#ad #sponsored";
  }
  return content;
}

/**
 * Middleware for Express routes
 */
export function requireSafePrompt(kind: "text" | "image" | "video") {
  return async (req: any, res: any, next: any) => {
    const prompt = req.body.prompt || req.body.content || "";
    
    if (!prompt) {
      return next();
    }
    
    const safety = await checkPromptSafety(prompt, kind);
    
    if (safety.decision === "block") {
      return res.status(422).json({
        error: "Content policy violation",
        reasons: safety.reasons,
        coaching: safety.coaching
      });
    }
    
    if (safety.decision === "review") {
      // Add flag for review but allow generation
      req.body.requiresReview = true;
      req.body.reviewReasons = safety.reasons;
    }
    
    next();
  };
}