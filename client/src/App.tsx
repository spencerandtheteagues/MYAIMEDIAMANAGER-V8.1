function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/admin/login" component={AdminLogin} />

      {/* Authenticated Routes */}
      <Route path="/create">{isAuthenticated ? <CreateContent /> : <Redirect to="/" />}</Route>
      <Route path="/calendar">{isAuthenticated ? <Calendar /> : <Redirect to="/" />}</Route>
      <Route path="/approval">{isAuthenticated ? <Approval /> : <Redirect to="/" />}</Route>
      <Route path="/analytics">{isAuthenticated ? <Analytics /> : <Redirect to="/" />}</Route>
      <Route path="/library">{isAuthenticated ? <Library /> : <Redirect to="/" />}</Route>
      <Route path="/campaigns">{isAuthenticated ? <Campaigns /> : <Redirect to="/" />}</Route>
      <Route path="/subscribe">{isAuthenticated ? <Subscribe /> : <Redirect to="/" />}</Route>
      <Route path="/subscription-success">{isAuthenticated ? <SubscriptionSuccess /> : <Redirect to="/" />}</Route>
      <Route path="/connect-platforms">{isAuthenticated ? <ConnectPlatforms /> : <Redirect to="/" />}</Route>
      <Route path="/settings">{isAuthenticated ? <Settings /> : <Redirect to="/" />}</Route>
      <Route path="/admin/dashboard">{isAuthenticated ? <AdminDashboard /> : <Redirect to="/admin/login" />}</Route>

      {/* Catch-all */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="flex h-screen overflow-hidden bg-background">
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}