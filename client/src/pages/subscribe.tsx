import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionPlan {
  id: string;
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  creditsPerMonth: number;
  features: string[];
  stripePriceId?: string;
}

const SubscribeForm = ({ plan, billingCycle }: { plan: SubscriptionPlan; billingCycle: 'monthly' | 'yearly' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription-success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-subscribe">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
        size="lg"
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Start ${plan.id === 'free' ? 'Free Trial' : 'Subscription'}`
        )}
      </Button>
      {plan.id === 'free' && (
        <p className="text-sm text-muted-foreground text-center">
          7-day free trial • Cancel anytime • No charges during trial
        </p>
      )}
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Get plan from URL params
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('plan') || 'starter';
    const cycle = params.get('cycle') as 'monthly' | 'yearly' || 'monthly';
    setBillingCycle(cycle);

    // Fetch available plans
    apiRequest("GET", "/api/subscription-plans")
      .then((res) => res.json())
      .then((data) => {
        setPlans(data);
        const plan = data.find((p: SubscriptionPlan) => p.id === planId);
        if (plan) {
          setSelectedPlan(plan);
          // Create subscription intent
          return apiRequest("POST", "/api/create-subscription", {
            planId: plan.id,
            billingCycle: cycle
          });
        }
        throw new Error("Invalid plan selected");
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data.message === "Already subscribed") {
          toast({
            title: "Already Subscribed",
            description: "You already have an active subscription",
          });
          navigate("/dashboard");
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error setting up subscription:", error);
        toast({
          title: "Error",
          description: "Failed to load subscription options",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  }, []);

  if (isLoading || !clientSecret || !selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" data-testid="loader-subscribe"/>
      </div>
    );
  }

  const price = billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;
  const savings = billingCycle === 'yearly' ? 
    (parseFloat(selectedPlan.monthlyPrice.toString()) * 12 - parseFloat(selectedPlan.yearlyPrice.toString())) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-muted-foreground">
            {selectedPlan.id === 'free' ? 
              'Start your 7-day free trial with full access' : 
              'Secure payment powered by Stripe'
            }
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedPlan.displayName}</CardTitle>
                <CardDescription>
                  {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} Billing
                  {billingCycle === 'yearly' && savings > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      Save ${savings.toFixed(0)}/year
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${price}</div>
                <div className="text-sm text-muted-foreground">
                  per {billingCycle === 'monthly' ? 'month' : 'year'}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-6">
              <div className="font-semibold text-sm text-muted-foreground mb-2">
                Included in your plan:
              </div>
              {selectedPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center" data-testid={`feature-${index}`}>
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
              <div className="flex items-center pt-2">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm font-semibold">
                  {selectedPlan.creditsPerMonth.toLocaleString()} AI credits per month
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              Enter your payment details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm plan={selectedPlan} billingCycle={billingCycle} />
            </Elements>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Your payment info is secure and encrypted.</p>
          <p>You can cancel or change your subscription anytime.</p>
        </div>
      </div>
    </div>
  );
}