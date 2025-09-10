export const TRIAL = {
  variant: process.env.TRIAL_VARIANT === "card14" ? "card14" : "nocard7",
  variants: {
    nocard7: { days: 7, images: 6, videos: 0, unlockVideoRequiresCard: true },
    card14: { days: 14, images: 30, videos: 3, unlockVideoRequiresCard: true }
  },
  rateLimit: { windowMinutes: 60, maxOps: 10 },
  videoSecondsCap: 8
} as const;
export type TrialVariant = keyof typeof TRIAL["variants"];