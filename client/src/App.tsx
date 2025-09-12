import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Schedule from "./pages/schedule";
import AdminPanel from "./pages/admin";
import Billing from "./pages/billing";
import Referrals from "./pages/referrals";
import Help from "./pages/help";
import Trial from "./pages/trial";
import Landing from "./pages/landing";
import Auth from "./pages/auth";
import Sidebar from "./components/layout/sidebar";
import Header from "./components/layout/header";
import TrialWelcomePopup from "./components/trial-welcome-popup";

function Router() {
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
        <Route path="/trial" component={Trial} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // If authenticated, show the main app
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TrialWelcomePopup />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/create" component={CreateContent} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/approval" component={Approval} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/library" component={Library} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/platforms" component={Platforms} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/settings" component={Settings} />
          <Route path="/billing" component={Billing} />
          <Route path="/referrals" component={Referrals} />
          <Route path="/help" component={Help} />
          <Route path="/trial" component={Trial} />
          <Route path="/admin" component={AdminPanel} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
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
