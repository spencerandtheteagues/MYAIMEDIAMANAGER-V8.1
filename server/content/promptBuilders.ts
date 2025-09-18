import { BrandProfile, Platform, PLATFORM_CONSTRAINTS, Tone } from "./config";
import { templateFor, PostType } from "./templates";
import { buildEnhancedPrompt, detectIndustry, selectEmotionalTrigger, getNextFormula, CONTENT_FORMULAS } from "./enhancedPrompts";

export interface BuiltPrompt {
  system: string;
  user: string;
  constraints: { maxChars: number; maxHashtags: number; readabilityMaxGrade: number; };
}

// Enhanced version with professional expertise
export function buildPrompt(opts: {
  platform: Platform;
  postType: PostType;
  brand: BrandProfile;
  campaignTheme?: string;
  product?: string;
  desiredTone?: Tone;
  callToAction?: string;
  useEnhanced?: boolean;
  formulaIndex?: number;
  priorCaptions?: string[];
}) : BuiltPrompt {
  // Use enhanced prompts by default for better quality
  const useEnhanced = opts.useEnhanced !== false;

  if (useEnhanced) {
    // Detect industry from brand context
    const industry = detectIndustry(opts.brand, opts.product);

    // Select formula for variety (rotate through 14 formulas)
    const formulaKey = opts.formulaIndex !== undefined
      ? getNextFormula(opts.formulaIndex)
      : 'hook';

    // Select appropriate emotional trigger
    const emotionalTrigger = selectEmotionalTrigger(opts.postType);

    return buildEnhancedPrompt({
      platform: opts.platform,
      postType: opts.postType,
      brand: opts.brand,
      formula: formulaKey,
      industry,
      emotionalTrigger,
      campaignTheme: opts.campaignTheme,
      product: opts.product,
      desiredTone: opts.desiredTone,
      callToAction: opts.callToAction,
      priorCaptions: opts.priorCaptions
    });
  }

  // Fallback to original simple prompt (kept for compatibility)
  const pc = PLATFORM_CONSTRAINTS[opts.platform];
  const tone = opts.desiredTone || opts.brand.voice || "friendly";
  const cta = opts.callToAction || (opts.brand.preferredCTAs?.[0] ?? "Learn more");
  const base = templateFor(opts.postType, opts.brand);

  const system = `You are a senior social media copywriter.
Write in a ${tone} voice for ${opts.brand.brandName || "the brand"}.
Honor platform constraints and avoid spammy language.`;

  const user = [
    base,
    opts.campaignTheme ? `Theme: ${opts.campaignTheme}.` : "",
    opts.product ? `Focus product/service: ${opts.product}.` : "",
    opts.brand.valueProps?.length ? `Value props: ${opts.brand.valueProps.join(", ")}.` : "",
    `Target audience: ${opts.brand.targetAudience || "small business owners"}.`,
    `Include 1-sentence hook, value, and CTA: "${cta}".`,
    `Add 3–5 niche hashtags relevant to the topic (no generic tags).`,
    `MAX ${pc.maxChars} chars. Reading grade ≤ ${pc.readabilityMaxGrade}.`,
  ].filter(Boolean).join("\n");

  return { system, user, constraints: {
    maxChars: pc.maxChars,
    maxHashtags: pc.maxHashtags,
    readabilityMaxGrade: pc.readabilityMaxGrade
  }};
}

// Export formula list for UI and campaign generation
export { CONTENT_FORMULAS, getNextFormula };