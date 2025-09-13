import { TRIAL_ALLOCATIONS, CREDIT_COSTS } from "../../../shared/credits";

export const TRIAL_CARDS = [
  {
    id: "nocard7",
    name: "Lite Trial", 
    subtitle: "No card required — 7 days",
    bullets: [
      `${TRIAL_ALLOCATIONS.nocard7.totalCredits} total credits included`,
      `${TRIAL_ALLOCATIONS.nocard7.images} AI images (${TRIAL_ALLOCATIONS.nocard7.images * CREDIT_COSTS.image} credits)`,
      `${TRIAL_ALLOCATIONS.nocard7.videos} videos (upgrade for video)`
    ],
    primaryCta: "Start Lite Trial",
    footnote: "Best for trying content creation without a card."
  },
  {
    id: "card14", 
    name: "Pro Trial",
    subtitle: "Card on file — 14 days",
    bullets: [
      `${TRIAL_ALLOCATIONS.card14.totalCredits} total credits included`,
      `${TRIAL_ALLOCATIONS.card14.images} AI images (${TRIAL_ALLOCATIONS.card14.images * CREDIT_COSTS.image} credits)`,
      `${TRIAL_ALLOCATIONS.card14.videos} AI videos (${TRIAL_ALLOCATIONS.card14.videos * CREDIT_COSTS.video} credits)`
    ],
    primaryCta: "Start Pro Trial (Add Card)",
    footnote: "Best for testing full workflow including video."
  }
] as const;