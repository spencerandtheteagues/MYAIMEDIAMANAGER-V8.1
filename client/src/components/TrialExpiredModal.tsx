import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, Crown, Rocket, Sparkles, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "Perfect for small businesses",
    credits: "190 credits/month",
    features: [
      "190 credits per month",
      "1 campaign (14 posts)",
      "3 social accounts",
      "AI content generation",
      "Analytics dashboard"
    ],
    icon: Rocket,
    color: "from-blue-600 to-cyan-600"
  },
  {
    id: "professional",
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "For growing businesses",
    credits: "500 credits/month",
    features: [
      "500 credits per month",
      "10 social accounts",
      "Unlimited posts",
      "Advanced AI generation",
      "Priority support (24hr)"
    ],
    icon: Crown,
    color: "from-purple-600 to-pink-600",
    popular: true
  },
  {
    id: "business",
    name: "Business",
    price: "$199",
    period: "/month",
    description: "For large teams",
    credits: "2000 credits/month",
    features: [
      "2000 credits per month",
      "Unlimited accounts",
      "API access",
      "Dedicated manager",
      "Custom integrations"
    ],
    icon: Sparkles,
    color: "from-amber-600 to-orange-600"
  }
];

interface TrialExpiredModalProps {
  open: boolean;
  trialEndDate?: string;
}

export function TrialExpiredModal({ open, trialEndDate }: TrialExpiredModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLocking, setIsLocking] = useState(false);

  const lockAccountMutation = useMutation({
    mutationFn: async () => {
      setIsLocking(true);
      return apiRequest("/api/user/lock-account", {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Account Locked",
        description: "Your account has been locked. You can unlock it anytime by purchasing a subscription.",
        variant: "destructive"
      });
      // Redirect to a locked account page or reload to show locked state
      window.location.href = "/trial-expired";
    },
    onError: (error: any) => {
      setIsLocking(false);
      toast({
        title: "Error",
        description: error.message || "Failed to process your request",
        variant: "destructive"
      });
    }
  });

  const handleSelectPlan = (planId: string) => {
    setLocation(`/checkout?plan=${planId}&returnUrl=/dashboard`);
  };

  const handleNotNow = () => {
    lockAccountMutation.mutate();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Your trial period";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950/50 to-pink-950/50 border-purple-800/50">
        {/* Header Section */}
        <div className="relative p-8 pb-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-b border-purple-800/30">
          <div className="absolute top-4 right-4">
            <Clock className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-white mb-2">
              Your Trial Has Expired
            </DialogTitle>
            <DialogDescription className="text-lg text-gray-300">
              {formatDate(trialEndDate)} has ended. Choose a plan to continue creating amazing content with AI.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Plans Section */}
        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden border-purple-800/50 bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-300 ${
                    plan.popular ? "ring-2 ring-purple-600 shadow-lg shadow-purple-600/20" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${plan.color} p-2.5 mb-4`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                      <div className="text-sm text-purple-400 mt-1">{plan.credits}</div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold`}
                      data-testid={`button-select-${plan.id}`}
                    >
                      Choose {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-purple-800/30">
            <div className="flex items-center space-x-2 text-amber-500">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-medium">
                Choosing "Not Now" will lock your account until you subscribe
              </span>
            </div>
            
            <Button
              onClick={handleNotNow}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-red-900/20 border border-red-900/50"
              disabled={isLocking}
              data-testid="button-not-now"
            >
              {isLocking ? "Locking Account..." : "Not Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}