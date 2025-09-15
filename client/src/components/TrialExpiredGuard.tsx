import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  tier: string;
  trialEndsAt?: string | null;
  subscriptionStatus?: string;
  isTrialExpired?: boolean;
}

/**
 * Guard component that checks if user's trial has expired
 * and redirects to trial-expired page if necessary
 */
export default function TrialExpiredGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  
  // Get user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  useEffect(() => {
    if (!user || isLoading) return;

    // Check if user is on a trial tier
    const trialTiers = ['free_trial', 'nocard7', 'card7'];
    const isOnTrial = trialTiers.includes(user.tier);
    
    if (!isOnTrial) {
      // Not on trial, allow access
      return;
    }

    // Check if trial has expired
    const now = new Date();
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    
    if (!trialEndsAt) {
      // No trial end date, shouldn't happen but allow access
      console.warn('User on trial tier but no trialEndsAt date');
      return;
    }

    const isTrialExpired = now > trialEndsAt;
    
    // List of allowed paths when trial is expired
    const allowedPaths = [
      '/trial-expired',
      '/billing',
      '/checkout',
      '/checkout/return',
      '/pricing'
    ];
    
    // Check if current path is allowed
    const currentPath = location;
    const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));
    
    if (isTrialExpired && !isAllowedPath) {
      // Trial expired and trying to access restricted page
      console.log(`Trial expired for user ${user.email}, redirecting to /trial-expired`);
      setLocation('/trial-expired');
    }
  }, [user, isLoading, location, setLocation]);

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Checking account status...</div>
      </div>
    );
  }

  // Render children if check passes
  return <>{children}</>;
}