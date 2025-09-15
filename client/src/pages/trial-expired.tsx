import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const subscriptionPlans = [
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    period: "/month",
    credits: 190,
    features: [
      "190 credits per month",
      "1 campaign: 14 image+text posts",
      "3 social media accounts",
      "AI content generation",
      "Analytics dashboard",
      "Email support"
    ],
    recommended: false
  },
  {
    id: "professional",
    name: "Professional",
    price: "$59",
    period: "/month",
    credits: 590,
    features: [
      "590 credits per month",
      "3 campaigns: 42 posts total",
      "5 social media accounts",
      "AI image & video generation",
      "Advanced analytics",
      "Priority support"
    ],
    recommended: true
  },
  {
    id: "business",
    name: "Business",
    price: "$119",
    period: "/month",
    credits: 1190,
    features: [
      "1,190 credits per month",
      "7 campaigns: 98 posts total",
      "10 social media accounts",
      "Unlimited AI generation",
      "Team collaboration",
      "24/7 phone & chat support"
    ],
    recommended: false
  }
];

export default function TrialExpired() {
  const [, setLocation] = useLocation();
  
  // Get user data to show trial end date
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleSelectPlan = (planId: string) => {
    // Navigate to checkout with selected plan
    setLocation(`/checkout?plan=${planId}`);
  };

  const trialEndDate = user?.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Alert Message */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Your Free Trial Has Expired
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            {trialEndDate && `Your trial ended on ${trialEndDate}`}
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upgrade now to continue creating amazing content with AI and managing your social media presence.
            Choose a plan that fits your business needs.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.recommended ? 'border-primary shadow-lg' : ''}`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.recommended && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </CardDescription>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.credits} credits per month
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.recommended ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleSelectPlan(plan.id)}
                  data-testid={`button-select-${plan.id}`}
                >
                  {plan.recommended ? 'Get Started' : 'Select Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Options */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Need More Flexibility?</h3>
                <p className="text-muted-foreground mb-3">
                  We also offer a Pay-As-You-Go option where you can purchase credits as needed without a monthly commitment.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/pricing')}
                  data-testid="button-view-all-options"
                >
                  View All Options
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Message */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Questions about pricing? {' '}
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={() => setLocation('/help')}
            >
              Contact our support team
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}