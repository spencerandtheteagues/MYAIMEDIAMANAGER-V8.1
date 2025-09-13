export const TRIAL_CARDS = [
  {
    id: "nocard7",
    name: "Lite Trial",
    subtitle: "No card required — 7 days",
    bullets: [
      "Unlimited text generation",
      "6 AI image credits included",
      "0 video credits (upgrade for video)"
    ],
    primaryCta: "Start Lite Trial",
    footnote: "Best for trying content creation without a card."
  },
  {
    id: "card14",
    name: "Pro Trial",
    subtitle: "Card on file — 14 days",
    bullets: [
      "30 AI image credits included",
      "3 AI video credits (8s max)",
      "Cancel anytime during 14-day trial"
    ],
    primaryCta: "Start Pro Trial (Add Card)",
    footnote: "Best for testing full workflow including video."
  }
] as const;