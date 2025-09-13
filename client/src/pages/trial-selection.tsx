import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Sparkles, Zap, Building, Users, TrendingUp, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TrialSelection() {
  const [, setLocation] = useLocation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user has already selected a trial
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  // If user has already selected a trial, redirect to app
  if (user && !user.needsTrialSelection) {
    setLocation("/");
    return null;
  }

  const selectTrialMutation = useMutation({
    mutationFn: async (variant: string) => {
      return apiRequest("/api/trial/select", {
        method: "POST",
        body: JSON.stringify({ variant }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Welcome to MyAiMediaMgr!",
        description: "Your trial has been activated successfully.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate trial. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Note: Subscription checkout is now handled via custom checkout page at /checkout

  const handleSelection = (optionId: string, isSubscription: boolean = false) => {
    setSelectedOption(optionId);
    
    if (isSubscription) {
      // For subscriptions, redirect to custom checkout
      setLocation(`/checkout?plan=${optionId}`);
    } else if (optionId === "card14") {
      // For Pro trial, redirect to checkout with $1 verification
      setLocation(`/checkout?plan=professional&trial=true`);
    } else {
      // For Lite trial, activate directly
      selectTrialMutation.mutate(optionId);
    }
  };

  const isLoading = selectTrialMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-pink-950 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome to MyAiMediaMgr
          </h1>
          <p className="text-xl text-gray-300">
            Choose your plan to get started with AI-powered social media management
          </p>
          <p className="text-sm text-gray-400 mt-2">
            You must select a trial or subscription to continue
          </p>
        </div>

        <Tabs defaultValue="trials" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="trials">Free Trials</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

          {/* Free Trials Tab */}
          <TabsContent value="trials" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Lite Trial */}
              <Card className="relative overflow-hidden border-2 border-purple-500/20 bg-gradient-to-br from-slate-900 to-purple-900/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Sparkles className="h-8 w-8 text-purple-400" />
                    <span className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
                      7 Days Free
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-white">Lite Trial</CardTitle>
                  <CardDescription className="text-gray-300">
                    Perfect for testing the waters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>30 AI Credits</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>1 Social Platform</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>AI Content Generation</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Image Generation (6 images)</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={() => handleSelection("nocard7")}
                    disabled={isLoading || selectedOption === "nocard7"}
                  >
                    {selectedOption === "nocard7" && isLoading ? "Activating..." : "Start Lite Trial"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Pro Trial */}
              <Card className="relative overflow-hidden border-2 border-pink-500/20 bg-gradient-to-br from-slate-900 to-pink-900/20">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  RECOMMENDED
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Zap className="h-8 w-8 text-pink-400" />
                    <span className="text-sm bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full">
                      14 Days Free
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-white">Pro Trial</CardTitle>
                  <CardDescription className="text-gray-300">
                    Full experience with card verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>180 AI Credits</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>3 Social Platforms</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>1 Full Campaign</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Image Generation (12 images)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Video Generation (2 videos)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CreditCard className="h-4 w-4" />
                    <span>Card required (not charged during trial)</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    onClick={() => handleSelection("card14")}
                    disabled={isLoading || selectedOption === "card14"}
                  >
                    {selectedOption === "card14" && isLoading ? "Activating..." : "Start Pro Trial"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Starter Plan */}
              <Card className="relative overflow-hidden border-2 border-blue-500/20 bg-gradient-to-br from-slate-900 to-blue-900/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-8 w-8 text-blue-400" />
                    <span className="text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                      Best for Solopreneurs
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-white">Starter</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">$19</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>200 AI Credits/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>3 Social Platforms</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>2 Campaigns/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Basic Analytics</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    onClick={() => handleSelection("starter", true)}
                    disabled={isLoading || selectedOption === "starter"}
                  >
                    {selectedOption === "starter" && isLoading ? "Processing..." : "Subscribe to Starter"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Professional Plan */}
              <Card className="relative overflow-hidden border-2 border-green-500/20 bg-gradient-to-br from-slate-900 to-green-900/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <BarChart className="h-8 w-8 text-green-400" />
                    <span className="text-sm bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-white">Professional</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">$49</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>500 AI Credits/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Unlimited Platforms</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>5 Campaigns/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Advanced Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Video Generation</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    onClick={() => handleSelection("professional", true)}
                    disabled={isLoading || selectedOption === "professional"}
                  >
                    {selectedOption === "professional" && isLoading ? "Processing..." : "Subscribe to Professional"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Business Plan */}
              <Card className="relative overflow-hidden border-2 border-yellow-500/20 bg-gradient-to-br from-slate-900 to-yellow-900/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Building className="h-8 w-8 text-yellow-400" />
                    <span className="text-sm bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                      For Teams
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-white">Business</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">$199</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>2000 AI Credits/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Unlimited Everything</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Team Collaboration</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Priority Support</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Custom Integrations</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>White-label Options</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    onClick={() => handleSelection("business", true)}
                    disabled={isLoading || selectedOption === "business"}
                  >
                    {selectedOption === "business" && isLoading ? "Processing..." : "Subscribe to Business"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-12 text-gray-400">
          <p className="text-sm">
            All plans include AI-powered content generation, scheduling, and analytics.
          </p>
          <p className="text-sm mt-2">
            No credit card required for Lite Trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}