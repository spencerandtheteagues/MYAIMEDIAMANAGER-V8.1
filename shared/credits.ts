// Unified Credit System Configuration
// All credit values and costs should reference this file for consistency

export const CREDIT_COSTS = {
  text: 1,
  image: 5, 
  video: 20
} as const;

// Trial credit allocations (in individual items that convert to unified credits)
export const TRIAL_ALLOCATIONS = {
  nocard7: {
    days: 7,
    images: 6,    // = 30 unified credits
    videos: 0,    // = 0 unified credits  
    totalCredits: 30,
    platformConnections: 1,
    campaigns: 0,
    unlockVideoRequiresCard: true
  },
  card14: {
    days: 14, 
    images: 36,   // = 180 unified credits total (14 campaign + 22 additional)
    videos: 2,    // = 40 unified credits 
    totalCredits: 180,
    platformConnections: 3,
    campaigns: 1,
    unlockVideoRequiresCard: false
  }
} as const;

// Calculate unified credit value from individual allocations
export function calculateTotalCredits(images: number, videos: number): number {
  return (images * CREDIT_COSTS.image) + (videos * CREDIT_COSTS.video);
}

// Convert unified credits to individual allocations (for display)
export function creditsToItems(credits: number): { images: number, videos: number } {
  // Prioritize some videos (more valuable), then fill with images
  const maxVideos = Math.floor(credits / CREDIT_COSTS.video);
  const videoAllocation = Math.min(maxVideos, Math.floor(credits * 0.3 / CREDIT_COSTS.video)); // ~30% for videos
  const remainingCredits = credits - (videoAllocation * CREDIT_COSTS.video);
  const imageAllocation = Math.floor(remainingCredits / CREDIT_COSTS.image);
  
  return {
    images: imageAllocation,
    videos: videoAllocation
  };
}

export type TrialVariant = keyof typeof TRIAL_ALLOCATIONS;