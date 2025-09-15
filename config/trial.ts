import { TRIAL_ALLOCATIONS, type TrialVariant } from "../shared/credits";

export const TRIAL = {
  variant: process.env.TRIAL_VARIANT === "card14" ? "card14" : "nocard7",
  variants: TRIAL_ALLOCATIONS,
  rateLimit: { windowMinutes: 60, maxOps: 10 },
  videoSecondsCap: 8
} as const;

export type { TrialVariant };