import { Switch, Route } from "wouter";
import { queryClient, setGlobalRestrictionHandler } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/dashboard";
import CreateContent from "./pages/create-content";
import Calendar from "./pages/calendar";
import Approval from "./pages/approval";
import Analytics from "./pages/analytics";
import Library from "./pages/library";
import Settings from "./pages/settings";
import Campaigns from "./pages/campaigns";
import Platforms from "./pages/platforms";
import AdminPanel from "./pages/admin";
import Billing from "./pages/billing";
import Referrals from "./pages/referrals";
import Help from "./pages/help";
import Trial from "./pages/trial";
import Landing from "./pages/landing";
import Auth from "./pages/auth";
import Pricing from "./pages/pricing";
import TrialSelection from "./pages/trial-selection";
import VerifyEmail from "./pages/verify-email";
import Checkout from "./pages/checkout";
import CheckoutReturn from "./pages/checkout-return";
import AIBrainstorm from "./pages/ai-brainstorm";
import TermsOfService from "./pages/terms-of-service";
import PrivacyPolicy from "./pages/privacy-policy";
import Sidebar from "./components/layout/sidebar";
import Header from "./components/layout/header";
import TrialWelcomePopup from "./components/trial-welcome-popup";
import RestrictionDialog from "./components/restriction-dialogs";
import TrialExpired from "./pages/trial-expired";
import { NotificationPopup } from "./components/NotificationPopup";
import { TrialCountdown } from "./components/TrialCountdown";
import { TrialExpiredModal } from "./components/TrialExpiredModal";
import { useRestrictionHandler } from "./hooks/useRestrictionHandler";
import { useEffect, useState, useMemo, useCallback } from "react";

function Router() {
  // Initialize restriction handler
  const { restrictionState, showRestriction, hideRestriction } = useRestrictionHandler();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  
  // Set up global restriction handler
  useEffect(() => {
    setGlobalRestrictionHandler(showRestriction);
  }, [showRestriction]);

  // Check authentication status
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Show loading state while checking authentication (with timeout)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If there's an error or not authenticated, show landing page
  // This handles database connection errors gracefully
  if (error || !user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={Auth} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/trial" component={Trial} />
        <Route path="/trial-selection" component={TrialSelection} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/checkout/return" component={CheckoutReturn} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route component={Landing} />
      </Switch>
    );
  }
  
  // Check if user needs to select a trial
  if ((user as any)?.needsTrialSelection) {
    return (
      <Switch>
        <Route path="/trial-selection" component={TrialSelection} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route component={TrialSelection} />
      </Switch>
    );
  }

  // Check if account is locked or trial has expired (memoized to prevent re-computation)
  const { isTrialExpired, isTrialUser, isAccountLocked } = useMemo(() => {
    const userData = user as any;
    return {
      isTrialExpired: userData?.trialEndsAt && new Date(userData.trialEndsAt) < new Date(),
      isTrialUser: userData?.tier === 'free' && userData?.subscriptionStatus === 'trial',
      isAccountLocked: userData?.isLocked
    };
  }, [user]);

  // Show trial expired modal for expired trial users who haven't upgraded (only once)
  useEffect(() => {
    if (isTrialUser && isTrialExpired && !isAccountLocked && !showTrialExpiredModal) {
      setShowTrialExpiredModal(true);
    }
  }, [isTrialUser, isTrialExpired, isAccountLocked, showTrialExpiredModal]);

  // If account is locked, redirect to trial-expired page
  if (isAccountLocked) {
    return (
      <Switch>
        <Route path="/trial-expired" component={TrialExpired} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/checkout/return" component={CheckoutReturn} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route component={TrialExpired} />
      </Switch>
    );
  }

  // If authenticated, show the main app with restriction dialog system
  return (
    <>
      <div className="flex min-h-screen overflow-hidden bg-background">
        <TrialWelcomePopup />
        <NotificationPopup />
        
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Mobile Sidebar Sheet */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Header onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
          <div className="p-4 sm:p-6">
            <TrialCountdown />
            <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/create" component={CreateContent} />
            <Route path="/ai-brainstorm" component={AIBrainstorm} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/approval" component={Approval} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/library" component={Library} />
            <Route path="/campaigns" component={Campaigns} />
            <Route path="/platforms" component={Platforms} />
            <Route path="/settings" component={Settings} />
            <Route path="/billing" component={Billing} />
            <Route path="/referrals" component={Referrals} />
            <Route path="/help" component={Help} />
            <Route path="/trial" component={Trial} />
            <Route path="/trial-selection" component={TrialSelection} />
            <Route path="/trial-expired" component={TrialExpired} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/checkout/return" component={CheckoutReturn} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/admin" component={AdminPanel} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
      
      {/* Restriction Dialog */}
      {restrictionState.data && (
        <RestrictionDialog
          open={restrictionState.isOpen}
          onOpenChange={hideRestriction}
          restrictionData={restrictionState.data}
        />
      )}
      
      {/* Trial Expired Modal */}
      <TrialExpiredModal 
        open={showTrialExpiredModal} 
        trialEndDate={(user as any)?.trialEndsAt}
        onOpenChange={setShowTrialExpiredModal}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
