// Feature Flags for progressive enhancement
// This allows us to roll out new features without breaking existing functionality

export const featureFlags = {
  // Platform preview system
  platformPreviews: {
    enabled: true,
    showInApprovalQueue: true,
    enableCaptionGeneration: true,
    enableInlineEditing: true,
  },

  // AI enhancements
  ai: {
    captionGeneration: true,
    smartHashtags: true,
    contentImprovement: true,
  },

  // UI improvements
  ui: {
    modernPreviewCards: true,
    animatedTransitions: true,
    darkModeOptimizations: true,
  }
};

// Helper function to check if a feature is enabled
export function isFeatureEnabled(featurePath: string): boolean {
  const keys = featurePath.split('.');
  let current: any = featureFlags;

  for (const key of keys) {
    if (current[key] === undefined) {
      return false;
    }
    current = current[key];
  }

  return current === true;
}

// Helper to get feature configuration
export function getFeatureConfig<T = any>(featurePath: string): T | undefined {
  const keys = featurePath.split('.');
  let current: any = featureFlags;

  for (const key of keys) {
    if (current[key] === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current as T;
}

// Toggle feature for testing (development only)
export function toggleFeature(featurePath: string, enabled: boolean): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Feature toggles are only available in development mode');
    return;
  }

  const keys = featurePath.split('.');
  let current: any = featureFlags;

  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] === undefined) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = enabled;
}