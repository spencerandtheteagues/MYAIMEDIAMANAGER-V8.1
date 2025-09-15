// For now, define values directly until import path is resolved
const CREDIT_COSTS = {
  text: 1,
  image: 5, 
  video: 20
} as const;

const TRIAL_ALLOCATIONS = {
  nocard7: {
    days: 7,
    images: 6,
    videos: 0,
    totalCredits: 30,
    platformConnections: 1,
    campaigns: 0,
    unlockVideoRequiresCard: true
  },
  card14: {
    days: 14, 
    images: 36, // 14 campaign images + 22 additional images (180 total credits)
    videos: 2,
    totalCredits: 180,
    platformConnections: 3,
    campaigns: 1,
    unlockVideoRequiresCard: false
  }
} as const;

export const TRIAL_CARDS = [
  {
    id: "nocard7",
    name: "Lite Trial", 
    subtitle: "No card required — 7 days",
    bullets: [
      `${TRIAL_ALLOCATIONS.nocard7.totalCredits} total credits included`,
      `${TRIAL_ALLOCATIONS.nocard7.platformConnections} platform connection`,
      `Unlimited AI text posts`,
      `${TRIAL_ALLOCATIONS.nocard7.images} AI images`,
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
      `${TRIAL_ALLOCATIONS.card14.platformConnections} platform connections`,
      `Unlimited AI text posts`,
      `1 campaign: 14 image+text posts (2 per day/7 days)`,
      `${TRIAL_ALLOCATIONS.card14.videos} AI videos + additional images`
    ],
    primaryCta: "Start Pro Trial (Add Card)",
    footnote: "Best for testing full workflow including campaigns."
  }
] as const;