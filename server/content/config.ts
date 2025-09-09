// Platform + quality knobs. Tweak without code changes.
export type Platform = "x"|"instagram"|"facebook"|"linkedin"|"tiktok"|"youtubeShorts";
export type PostType = "promo"|"announcement"|"tutorial"|"testimonial"|"faq"|"event"|"seasonal";

export interface PlatformConstraints {
  maxChars: number;
  maxHashtags: number;
  allowedRatios: Array<"1:1"|"4:5"|"16:9"|"9:16">;
  readabilityMaxGrade: number; // ≈ Flesch-Kincaid target
}

export const PLATFORM_CONSTRAINTS: Record<Platform, PlatformConstraints> = {
  x:              { maxChars: 260, maxHashtags: 4, allowedRatios: ["1:1","16:9"], readabilityMaxGrade: 8 },
  instagram:      { maxChars: 2200, maxHashtags: 5, allowedRatios: ["1:1","4:5","9:16"], readabilityMaxGrade: 8 },
  facebook:       { maxChars: 2000, maxHashtags: 5, allowedRatios: ["1:1","16:9"], readabilityMaxGrade: 8 },
  linkedin:       { maxChars: 3000, maxHashtags: 5, allowedRatios: ["1:1","16:9"], readabilityMaxGrade: 10 },
  tiktok:         { maxChars: 2200, maxHashtags: 5, allowedRatios: ["9:16"], readabilityMaxGrade: 7 },
  youtubeShorts:  { maxChars: 150,  maxHashtags: 3, allowedRatios: ["9:16"], readabilityMaxGrade: 7 },
};

export const DEFAULT_TONES = ["friendly","bold","professional","playful"] as const;
export type Tone = typeof DEFAULT_TONES[number];

export interface BrandProfile {
  brandName: string;
  voice?: Tone;
  targetAudience?: string;
  products?: string[];
  valueProps?: string[];
  bannedPhrases?: string[];
  requiredDisclaimers?: string[];
  preferredCTAs?: string[];
  keywords?: string[];
}

export const HASHTAG_BLOCKLIST = [
  /follow4follow/i, /like4like/i, /nsfw/i, /giveaway/i, /lottery/i, /crypto.*pump/i
];

export const READABILITY_DEFAULT = 8;

export function ratioFromPlatform(p: Platform): "1:1"|"4:5"|"16:9"|"9:16" {
  return PLATFORM_CONSTRAINTS[p].allowedRatios[0];
}