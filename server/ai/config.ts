export const MODELS = {
  text: "gemini-2.5-flash",
  chat: "gemini-2.5-flash",
  image: "imagen-4.0-generate-001",
  veoFast: "veo-3.0-fast-generate-001",  // Veo 3 Fast
  veoFull: "veo-3.0-generate-001",       // Standard Veo 3
  chatgpt: "gpt-5", // ChatGPT-5 for brainstorming
  dalle: "dall-e-3" // DALL-E 3 for image fallback
} as const;

export const DEFAULTS = {
  temperature: 0.7,
  maxTokens: 2048,
  videoDurSec: 8
} as const;