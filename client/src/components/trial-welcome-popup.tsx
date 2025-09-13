import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Video, Image, Calendar, Sparkles, CreditCard, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    features: [
      "50 AI Images per month",
      "10 AI Videos per month",
      "Unlimited text posts",
      "Basic analytics",
      "5 social accounts",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 79,
    features: [
      "200 AI Images per month",
      "50 AI Videos per month",
      "Unlimited text posts",
      "Advanced analytics",
      "15 social accounts",
      "Team collaboration",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 199,
    features: [
      "Unlimited AI Images",
      "200 AI Videos per month",
      "Unlimited text posts",
      "Premium analytics",
      "Unlimited social accounts",
      "Team collaboration",
      "API access",
      "Dedicated support",
    ],
  },
];

export default function TrialWelcomePopup() {
  const [open, setOpen] = useState(false);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if we should show the popup (new user from Google login)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showTrialWelcome = urlParams.get("showTrialWelcome");
    
    if (showTrialWelcome === "true") {
      setOpen(true);
      // Remove the query parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Check user's trial status
  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
    enabled: open,
  });

  // Handle upgrading to card trial (for video access)
  const upgradeToCardTrial = useMutation({
    mutationFn: async () => {
      setProcessingUpgrade(true);
      // This will redirect to Stripe to add card
      const response = await apiRequest("POST", "/api/billing/upgrade-trial");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      setProcessingUpgrade(false);
      toast({
        title: "Error",
        description: "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      });
      console.error("Upgrade error:", error);
    },
  });

  // Handle subscription selection - redirect to custom checkout page
  const handleSubscriptionSelect = (tierId: string) => {
    // Redirect to custom checkout page with plan selection
    setLocation(`/checkout?plan=${tierId}`);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Welcome to MyAI MediaMgr!
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Your 7-day free trial has been activated. Let's get you started!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Current Trial Status */}
          <Card className="border-green-500/50 bg-green-50/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Your Free Trial is Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-semibold">Included in your trial:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-blue-500" />
                      <span>6 AI-generated images</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span>Unlimited text posts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>Smart scheduling</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">Trial expires:</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.trialEndsAt 
                      ? new Date(user.trialEndsAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : '7 days from now'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade to Video Creation */}
          <Card className="border-purple-500/50 bg-purple-50/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-500" />
                Unlock AI Video Creation
              </CardTitle>
              <CardDescription>
                Add your credit card to unlock 3 AI-generated videos in your trial
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>3 AI-generated videos (8 seconds each)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Extend trial to 14 days</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>30 AI images total</span>
                </li>
              </ul>
              <Button
                onClick={() => upgradeToCardTrial.mutate()}
                disabled={processingUpgrade}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Add Card for Videos
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Plans */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ready to go beyond the trial?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {subscriptionTiers.map((tier) => (
                <Card 
                  key={tier.id} 
                  className={tier.popular ? "border-blue-500 relative" : ""}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <div className="text-2xl font-bold">
                      ${tier.price}<span className="text-sm font-normal">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm mb-4">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSubscriptionSelect(tier.id)}
                      variant={tier.popular ? "default" : "outline"}
                      className="w-full"
                    >
                      Choose {tier.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Continue with Limited Trial */}
          <div className="flex justify-center pt-4 border-t">
            <Button
              onClick={() => setOpen(false)}
              variant="ghost"
              size="lg"
              className="text-muted-foreground hover:text-foreground"
            >
              Continue with Limited Free Trial →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}