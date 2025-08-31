import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/dashboard";
import CreateContent from "./pages/create-content";
import Calendar from "./pages/calendar";
import Approval from "./pages/approval";
import Analytics from "./pages/analytics";
import Library from "./pages/library";
import Settings from "./pages/settings";
import Campaigns from "./pages/campaigns";
import Pricing from "./pages/pricing";
import Landing from "./pages/landing";
import Subscribe from "./pages/subscribe";
import SubscriptionSuccess from "./pages/subscription-success";
import AdminLogin from "./pages/admin-login";
import AdminDashboard from "./pages/admin-dashboard";
import ConnectPlatforms from "./pages/connect-platforms";
import Sidebar from "./components/layout/sidebar";
import Header from "./components/layout/header";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminLogin} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show authenticated app
  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
          <Route path="/pricing" component={Pricing} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/subscription-success" component={SubscriptionSuccess} />
          <Route path="/connect-platforms" component={ConnectPlatforms} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
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
