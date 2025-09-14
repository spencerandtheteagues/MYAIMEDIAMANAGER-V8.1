import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface RestrictionData {
  restrictionType: "trial_expired" | "payment_failed" | "insufficient_credits";
  message: string;
  friendlyMessage: string;
  currentCredits: number;
  userTier: string;
  ctaOptions: Array<{
    type: "upgrade" | "credits" | "billing" | "support";
    text: string;
    action: string;
  }>;
  trialEndsAt?: string;
  subscriptionStatus?: string;
  requiredCredits?: number;
}

interface RestrictionState {
  isOpen: boolean;
  data: RestrictionData | null;
}

/**
 * Hook to manage platform access restrictions
 * Provides a global way to show restriction dialogs from API error responses
 */
export function useRestrictionHandler() {
  const [restrictionState, setRestrictionState] = useState<RestrictionState>({
    isOpen: false,
    data: null,
  });
  const queryClient = useQueryClient();

  // Function to show restriction dialog with data
  const showRestriction = (data: RestrictionData) => {
    setRestrictionState({
      isOpen: true,
      data,
    });
  };

  // Function to hide restriction dialog
  const hideRestriction = () => {
    setRestrictionState({
      isOpen: false,
      data: null,
    });
  };

  // Function to handle API error responses that contain restriction data
  const handleApiError = (error: any) => {
    if (error?.response?.status === 403 && error?.response?.data?.restrictionType) {
      const restrictionData = error.response.data;
      showRestriction(restrictionData);
      return true; // Indicates error was handled as restriction
    }
    return false; // Error was not a restriction
  };

  // Effect to listen for API errors globally
  useEffect(() => {
    const handleApiResponse = (response: any) => {
      // Check if response indicates a restriction
      if (response?.status === 403 && response?.data?.restrictionType) {
        showRestriction(response.data);
      }
    };

    // We'll add this to the query client's error handling
    // Note: This would need to be integrated with the existing query client setup
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  return {
    restrictionState,
    showRestriction,
    hideRestriction,
    handleApiError,
  };
}

// Global restriction handler instance
let globalRestrictionHandler: {
  showRestriction: (data: RestrictionData) => void;
} | null = null;

/**
 * Register the global restriction handler
 */
export function setGlobalRestrictionHandler(handler: {
  showRestriction: (data: RestrictionData) => void;
}) {
  globalRestrictionHandler = handler;
}

/**
 * Show restriction dialog from anywhere in the app
 */
export function showGlobalRestriction(data: RestrictionData) {
  if (globalRestrictionHandler) {
    globalRestrictionHandler.showRestriction(data);
  } else {
    console.warn("Global restriction handler not registered");
  }
}

export type { RestrictionData, RestrictionState };