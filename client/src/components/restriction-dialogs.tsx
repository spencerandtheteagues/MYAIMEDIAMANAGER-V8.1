import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Rocket,
  CreditCard,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Crown,
  Star,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RestrictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restrictionData: {
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
  };
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
  icon: any;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 19,
    credits: 190,
    icon: Star,
    features: [
      "190 AI credits per month",
      "Connect 3 social accounts",
      "AI content generation",
      "Content calendar",
      "Basic analytics"
    ]
  },
  {
    id: "professional", 
    name: "Professional",
    price: 49,
    credits: 500,
    icon: Crown,
    popular: true,
    features: [
      "500 AI credits per month",
      "Connect 5 social accounts",
      "AI image & video generation",
      "Campaign automation",
      "Advanced analytics",
      "Priority support"
    ]
  },
  {
    id: "business",
    name: "Business", 
    price: 199,
    credits: 2000,
    icon: Shield,
    features: [
      "2000 AI credits per month",
      "Unlimited social accounts",
      "Team collaboration",
      "White-label options",
      "API access",
      "24/7 phone support"
    ]
  }
];

const CREDIT_PACKS = [
  { credits: 50, price: 5, popular: false },
  { credits: 200, price: 18, popular: true },
  { credits: 500, price: 40, popular: false },
];

export function RestrictionDialog({ open, onOpenChange, restrictionData }: RestrictionDialogProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"plans" | "credits">("plans");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCheckoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest("POST", "/api/stripe/create-checkout-session", { planId });
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    }
  });

  const buyCreditsMutation = useMutation({
    mutationFn: async (credits: number) => {
      return apiRequest("POST", "/api/stripe/buy-credits", { credits });
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to start credit purchase",
        variant: "destructive",
      });
    }
  });

  const handlePlanSelect = (planId: string) => {
    createCheckoutMutation.mutate(planId);
  };

  const handleCreditPurchase = (credits: number) => {
    buyCreditsMutation.mutate(credits);
  };

  const handleNavigation = (action: string) => {
    onOpenChange(false);
    setLocation(action);
  };

  const getDialogContent = () => {
    switch (restrictionData.restrictionType) {
      case "trial_expired":
        return {
          icon: <Rocket className="w-12 h-12 text-primary" />,
          title: "Your Free Trial Has Ended! 🚀",
          description: "You've experienced the power of AI-driven social media management. Ready to unlock the full potential?",
          bgClass: "bg-gradient-to-br from-primary/5 to-accent/5"
        };
      
      case "payment_failed":
        return {
          icon: <CreditCard className="w-12 h-12 text-amber-500" />,
          title: "Payment Method Needs Attention 💳",
          description: "We couldn't process your payment. Update your billing info to keep creating amazing content!",
          bgClass: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10"
        };
      
      case "insufficient_credits":
        return {
          icon: <Zap className="w-12 h-12 text-yellow-500" />,
          title: "You're Out of Credits! ⚡",
          description: "Credits power all our AI magic! Get more to keep creating engaging content that grows your audience.",
          bgClass: "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10"
        };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${dialogContent.bgClass}`} data-testid="dialog-restriction">
        <DialogHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {dialogContent.icon}
          </div>
          <DialogTitle className="text-2xl font-bold">
            {dialogContent.title}
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {dialogContent.description}
          </DialogDescription>
          
          {/* Current Status */}
          <div className="flex justify-center items-center gap-4 mt-4">
            <Badge variant="outline" className="text-sm">
              Current Plan: {restrictionData.userTier || "Free"}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Credits: {restrictionData.currentCredits}
            </Badge>
            {restrictionData.trialEndsAt && (
              <Badge variant="destructive" className="text-sm">
                Trial ended: {new Date(restrictionData.trialEndsAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Tab Selection */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <Button
              variant={activeTab === "plans" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("plans")}
              data-testid="button-tab-plans"
            >
              <Crown className="w-4 h-4 mr-2" />
              Monthly Plans
            </Button>
            <Button
              variant={activeTab === "credits" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("credits")}
              data-testid="button-tab-credits"
            >
              <Zap className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          </div>
        </div>

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Monthly Subscription Plans</h3>
              <p className="text-muted-foreground">Get monthly credits plus exclusive features</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {PRICING_PLANS.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all hover:shadow-lg ${plan.popular ? 'ring-2 ring-primary' : ''}`}
                  data-testid={`card-plan-${plan.id}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <plan.icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                    <p className="text-sm text-muted-foreground">
                      {plan.credits} credits monthly
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handlePlanSelect(plan.id)}
                      disabled={createCheckoutMutation.isPending}
                      data-testid={`button-select-plan-${plan.id}`}
                    >
                      {createCheckoutMutation.isPending ? "Starting..." : "Get Started"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Cancel anytime • 30-day money-back guarantee
            </div>
          </div>
        )}

        {/* Credits Tab */}
        {activeTab === "credits" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">One-Time Credit Purchases</h3>
              <p className="text-muted-foreground">Perfect for occasional use or trying our features</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {CREDIT_PACKS.map((pack, idx) => (
                <Card 
                  key={idx} 
                  className={`relative transition-all hover:shadow-lg ${pack.popular ? 'ring-2 ring-primary' : ''}`}
                  data-testid={`card-credits-${pack.credits}`}
                >
                  {pack.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Best Value
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                    <CardTitle className="text-xl">{pack.credits} Credits</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">${pack.price}</span>
                    </CardDescription>
                    <p className="text-sm text-muted-foreground">
                      ${(pack.price / pack.credits).toFixed(2)} per credit
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex justify-between">
                        <span>Text posts:</span>
                        <span className="font-medium">{pack.credits} posts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Image posts:</span>
                        <span className="font-medium">{Math.floor(pack.credits / 5)} posts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Video posts:</span>
                        <span className="font-medium">{Math.floor(pack.credits / 20)} posts</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      variant={pack.popular ? "default" : "outline"}
                      onClick={() => handleCreditPurchase(pack.credits)}
                      disabled={buyCreditsMutation.isPending}
                      data-testid={`button-buy-credits-${pack.credits}`}
                    >
                      {buyCreditsMutation.isPending ? "Processing..." : "Buy Credits"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Credits never expire • Secure payment via Stripe
            </div>
          </div>
        )}

        <Separator className="my-6" />

        {/* Additional Actions for Payment Failed */}
        {restrictionData.restrictionType === "payment_failed" && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Need to Update Your Payment Method?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Access your billing portal to update your payment information
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => handleNavigation("/billing")}
                data-testid="button-update-billing"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Update Payment Method
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNavigation("/help")}
                data-testid="button-contact-support"
              >
                Contact Support
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="flex justify-between items-center pt-4">
          <div className="text-xs text-muted-foreground">
            Questions? <Button variant="link" className="p-0 h-auto text-xs" onClick={() => handleNavigation("/help")}>Contact Support</Button>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="button-close-dialog">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RestrictionDialog;