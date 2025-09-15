export const MODELS = {
  text: "gemini-2.0-flash-exp",
  image: "imagen-4.0-generate-001",
  veoFast: "veo-3.0-fast-generate-001",  // Correct model ID for Veo 3 Fast
  veoFull: "veo-3.0-generate-001"       // Correct model ID for standard Veo 3
} as const;

export const DEFAULTS = {
  temperature: 0.7,
  maxTokens: 2048,
  videoDurSec: 8
} as const;