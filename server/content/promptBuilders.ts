import { BrandProfile, Platform, PLATFORM_CONSTRAINTS, Tone } from "./config";
import { templateFor, PostType } from "./templates";

export interface BuiltPrompt {
  system: string;
  user: string;
  constraints: { maxChars: number; maxHashtags: number; readabilityMaxGrade: number; };
}

export function buildPrompt(opts: {
  platform: Platform;
  postType: PostType;
  brand: BrandProfile;
  campaignTheme?: string;
  product?: string;
  desiredTone?: Tone;
  callToAction?: string;
}) : BuiltPrompt {
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