import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutReturn() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Parse session ID from URL
  const params = new URLSearchParams(location.split('?')[1] || '');
  const sessionId = params.get("session_id");
  
  const [sessionStatus, setSessionStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const checkSession = async () => {
      if (!sessionId) {
        setError("No session ID found");
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiRequest("GET", `/api/billing/session-status/${sessionId}`);
        const data = await response.json();
        
        setSessionStatus(data.status);
        
        if (data.status === "complete") {
          // Payment successful - invalidate user data to refresh subscription status
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated.",
          });
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            setLocation("/");
          }, 3000);
        } else if (data.status === "open") {
          // Payment still processing or failed
          setError("Payment was not completed. Please try again.");
        }
      } catch (err: any) {
        console.error("Error checking session:", err);
        setError("Unable to verify payment status");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [sessionId, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
              <p className="text-lg text-white">Verifying your payment...</p>
              <p className="text-sm text-gray-400">Please wait while we confirm your transaction</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <h2 className="text-xl font-semibold text-white">Payment Issue</h2>
              <p className="text-center text-gray-400">{error}</p>
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={() => setLocation("/checkout")}
                  variant="outline"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => setLocation("/")}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionStatus === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
              <p className="text-center text-gray-300">
                Thank you for your subscription. Your account has been upgraded successfully.
              </p>
              <p className="text-sm text-gray-400">
                Redirecting to dashboard in a few seconds...
              </p>
              <Button 
                onClick={() => setLocation("/")}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Go to Dashboard Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback for unknown status
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Payment Status Unknown</h2>
            <p className="text-center text-gray-400">
              We couldn't determine the status of your payment. Please check your email for confirmation.
            </p>
            <Button 
              onClick={() => setLocation("/")}
              className="mt-4"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}