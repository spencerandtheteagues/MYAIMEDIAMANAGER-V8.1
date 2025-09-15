import { PlatformConstraints, HASHTAG_BLOCKLIST } from "./config";

export interface ValidationResult {
  ok: boolean;
  reasons: string[];
  coaching: string[];
}

export interface Candidate {
  caption: string;
  hashtags: string[];
  cta?: string;
}

export function validateContent(
  c: Candidate,
  constraints: PlatformConstraints,
  priorCaptions: string[] = [],   // pass last N captions to avoid dupes
): ValidationResult {
  const reasons: string[] = [];
  const coaching: string[] = [];

  // 1) Basic structure
  if (!c.caption || c.caption.trim().length < 10) {
    reasons.push("caption.too_short");
    coaching.push("Add a clear value sentence + benefit.");
  }

  // 2) Length
  if (c.caption.length > constraints.maxChars) {
    reasons.push("caption.too_long");
    coaching.push(`Shorten to ≤ ${constraints.maxChars} characters.`);
  }

  // 3) CTA
  if (!c.cta || c.cta.trim().length < 3) {
    reasons.push("cta.missing");
    coaching.push("End with a direct action (e.g., 'Book now' / 'DM us').");
  }

  // 4) Hashtags (3–5; niche; no spam)
  const uniqueTags = Array.from(new Set((c.hashtags || []).map(normalizeTag)));
  if (uniqueTags.length < 3 || uniqueTags.length > constraints.maxHashtags) {
    reasons.push("hashtags.count");
    coaching.push(`Use ${Math.min(5, constraints.maxHashtags)} niche hashtags relevant to your audience.`);
  }
  if (uniqueTags.some(tag => HASHTAG_BLOCKLIST.some(rx => rx.test(tag)))) {
    reasons.push("hashtags.blocklisted");
    coaching.push("Replace generic/spammy hashtags with niche tags tied to your topic.");
  }

  // 5) Readability (very rough heuristic)
  const grade = readabilityGrade(c.caption);
  if (grade > constraints.readabilityMaxGrade) {
    reasons.push("readability.hard");
    coaching.push(`Use shorter sentences and concrete words (target grade ≤ ${constraints.readabilityMaxGrade}).`);
  }

  // 6) Near-duplicate check
  const isNearDup = priorCaptions.some(p => similarity(p, c.caption) > 0.92);
  if (isNearDup) {
    reasons.push("duplication.too_similar");
    coaching.push("Change the hook and the example to avoid repetition.");
  }

  return { ok: reasons.length === 0, reasons, coaching };
}

function normalizeTag(t: string) {
  const tag = t.trim().replace(/^#/, "");
  return `#${tag.toLowerCase()}`;
}

// Basic, fast similarity (cosine on char n-grams would be better; this is fine for guardrails)
function similarity(a: string, b: string): number {
  const set = (s: string) => new Set(s.toLowerCase().split(/\W+/).filter(Boolean));
  const A = set(a), B = set(b);
  const inter = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 0;
}

export function readabilityGrade(text: string): number {
  const sents = Math.max(1, (text.match(/[.!?]/g) || []).length);
  const words = text.trim().split(/\s+/).length;
  const avg = words / sents;
  // cheap heuristic: higher avg words/sentence -> higher grade
  return Math.min(14, Math.max(1, Math.round(avg)));
}