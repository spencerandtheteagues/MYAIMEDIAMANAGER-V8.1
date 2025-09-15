import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Verify payment status with backend
    const params = new URLSearchParams(window.location.search);
    const paymentIntent = params.get('payment_intent');
    const clientSecret = params.get('payment_intent_client_secret');

    if (paymentIntent) {
      apiRequest("POST", "/api/verify-subscription", {
        paymentIntent,
        clientSecret
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSubscriptionDetails(data.subscription);
            toast({
              title: "Welcome aboard!",
              description: "Your subscription is now active",
            });
          } else {
            throw new Error(data.message || "Verification failed");
          }
          setIsVerifying(false);
        })
        .catch((error) => {
          console.error("Verification error:", error);
          toast({
            title: "Verification Failed",
            description: "Please contact support if you were charged",
            variant: "destructive",
          });
          setIsVerifying(false);
        });
    } else {
      // No payment intent, just show success
      setIsVerifying(false);
    }
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your subscription...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl">Payment Successful!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your subscription is now active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscriptionDetails && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-semibold">{subscriptionDetails.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle:</span>
                  <span className="font-semibold capitalize">{subscriptionDetails.billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits Available:</span>
                  <span className="font-semibold">{subscriptionDetails.credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Billing Date:</span>
                  <span className="font-semibold">
                    {new Date(subscriptionDetails.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">What's Next?</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Your AI credits have been added to your account</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">You can now create unlimited campaigns</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Access to all premium features is enabled</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">You'll receive a receipt via email shortly</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => navigate("/dashboard")}
                className="flex-1"
                size="lg"
                data-testid="button-go-dashboard"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                onClick={() => navigate("/campaigns/new")}
                variant="outline"
                className="flex-1"
                size="lg"
                data-testid="button-create-campaign"
              >
                Create First Campaign
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Need help? Contact our support team at support@myaimediamgr.com</p>
        </div>
      </div>
    </div>
  );
}