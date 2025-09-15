import { BrandProfile, Platform } from "./config";

export type PostType = "promo"|"announcement"|"tutorial"|"testimonial"|"faq"|"event"|"seasonal";

export function templateFor(type: PostType, brand: BrandProfile) {
  const name = brand.brandName || "your brand";
  switch (type) {
    case "promo":
      return `Write a concise promotional post that highlights a single clear benefit of ${name}.
Use a punchy first sentence (the hook), one concrete proof (stat, result, mini-example), and a direct CTA.`;
    case "announcement":
      return `Announce a new feature or offer from ${name}. Lead with what's new, why it matters, and how to try it.`;
    case "tutorial":
      return `Explain a 3-step mini-tutorial related to ${name}'s product/service. Keep steps skimmable.`;
    case "testimonial":
      return `Transform this benefit into a short customer quote style (no real names). Emphasize outcome without fluff.`;
    case "faq":
      return `Answer one frequent customer question in 2–3 sentences with practical clarity.`;
    case "event":
      return `Promote an upcoming event for ${name}. Include date/time, value, and how to RSVP.`;
    case "seasonal":
      return `Tie a seasonal moment to ${name}'s value in a tasteful, timely way. Avoid clichés.`;
  }
}

export function artDirectionForImage(brand: BrandProfile, platform: Platform) {
  const palette = (brand.keywords || ["clean","bold","modern"]).join(", ");
  return `High-quality product/social image with brand-aligned palette (${palette}).
Subject centered, soft studio lighting, crisp edges, no watermark, no embedded text.
Composition fits platform ratio, export PNG.`;
}

export function storyboardForVideo(brand: BrandProfile) {
  return `8s storyboard:
0–2s HOOK: quick motion + bold overlay (≤5 words).
2–6s VALUE: one benefit and a mini-proof.
6–8s CTA: brand end card with a single action.
No copyrighted music. Export MP4.`;
}