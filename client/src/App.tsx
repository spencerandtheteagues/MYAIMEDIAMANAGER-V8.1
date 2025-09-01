import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import Sidebar from "./components/layout/sidebar";
import Header from "./components/layout/header";

function Router() {
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
          <Route path="/settings" component={Settings} />
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
