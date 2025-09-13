import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Star, Zap, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$15",
    period: "per month",
    description: "Perfect for individuals and small businesses",
    features: [
      "3 social media accounts",
      "50 posts per month",
      "Basic AI content generation",
      "Analytics dashboard",
      "Email support",
      "100 AI credits per month"
    ],
    notIncluded: [
      "Advanced AI features",
      "Team collaboration",
      "Priority support",
      "Custom integrations"
    ],
    color: "from-green-500 to-emerald-600",
    popular: false
  },
  {
    id: "professional",
    name: "Professional",
    price: "$49",
    period: "per month",
    description: "For growing businesses and agencies",
    features: [
      "10 social media accounts",
      "Unlimited posts",
      "Advanced AI content generation",
      "Full analytics suite",
      "Priority email support (24hr)",
      "500 AI credits per month",
      "Team collaboration (3 users)",
      "Content approval workflow",
      "Custom branding"
    ],
    notIncluded: [
      "Business features",
      "Dedicated support",
      "API access"
    ],
    color: "from-blue-500 to-indigo-600",
    popular: true
  },
  {
    id: "business",
    name: "Business",
    price: "$199",
    period: "per month",
    description: "For large organizations with complex needs",
    features: [
      "Unlimited social media accounts",
      "Unlimited posts",
      "Premium AI with custom training",
      "Advanced analytics & reporting",
      "Priority support (4hr response)",
      "2000 AI credits per month",
      "Unlimited team members",
      "Advanced approval workflows",
      "White-label options",
      "API access",
      "Custom integrations",
      "Dedicated success manager"
    ],
    notIncluded: [],
    color: "from-purple-500 to-pink-600",
    popular: false
  }
];

export default function Billing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const handleUpgrade = async (planId: string) => {
    setSelectedPlan(planId);
    // Redirect to custom checkout page
    setLocation(`/checkout?plan=${planId}`);
  };

  const currentPlanId = user?.tier || "free";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Choose the perfect plan for your social media management needs
        </p>
      </div>

      {user?.tier !== "free" && (
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{user?.tier === "business" ? "Business" : user?.tier === "professional" ? "Professional" : "Starter"} Plan</p>
                <p className="text-sm text-muted-foreground">Your next billing date is {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </div>
              <Button variant="outline">Manage Subscription</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.tier === "free" && (
        <Card className="mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Zap className="w-5 h-5" />
              Free Trial Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 dark:text-amber-300">
              You have {user?.credits || 0} credits remaining in your free trial. Upgrade to unlock unlimited features!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isUpgrade = plans.findIndex(p => p.id === plan.id) > plans.findIndex(p => p.id === currentPlanId);
          
          return (
            <Card 
              key={plan.id}
              className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrentPlan && (
                    <Badge variant="secondary">Current Plan</Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> {plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="font-medium mb-2">Includes:</div>
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.notIncluded.length > 0 && (
                    <>
                      <div className="font-medium mt-4 mb-2">Not included:</div>
                      {plan.notIncluded.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 opacity-60">
                          <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? `bg-gradient-to-r ${plan.color} text-white` : ''}`}
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || isProcessing || (currentPlanId !== "free" && !isUpgrade)}
                  onClick={() => handleUpgrade(plan.id)}
                  data-testid={`button-upgrade-${plan.id}`}
                >
                  {isProcessing && selectedPlan === plan.id ? (
                    "Processing..."
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : isUpgrade || currentPlanId === "free" ? (
                    <>
                      Upgrade Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    "Contact Sales"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 bg-muted/50">
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg">
            <div>
              <p className="font-medium">Payment Method</p>
              <p className="text-sm text-muted-foreground">
                {user?.tier !== "free" ? "•••• •••• •••• 4242" : "No payment method on file"}
              </p>
            </div>
            <Button variant="outline" size="sm">
              {user?.tier !== "free" ? "Update" : "Add Payment Method"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-background rounded-lg">
            <div>
              <p className="font-medium">Billing Email</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm">Change</Button>
          </div>
          
          {user?.tier !== "free" && (
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <p className="font-medium">Cancel Subscription</p>
                <p className="text-sm text-muted-foreground">Cancel anytime, keep access until end of billing period</p>
              </div>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                Cancel Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}