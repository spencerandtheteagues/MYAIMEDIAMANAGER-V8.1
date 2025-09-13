import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface EmbeddedCheckoutFormProps {
  planId: string;
  billingCycle: "monthly" | "yearly";
  price: number;
  trial?: boolean;
}

export default function EmbeddedCheckoutForm({ planId, billingCycle, price, trial }: EmbeddedCheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Different endpoints for trial vs regular subscription
        const endpoint = trial 
          ? "/api/billing/pro-trial" 
          : "/api/billing/custom-checkout";
        
        const body = trial 
          ? {} 
          : { planId, billingCycle, price, mode: "embedded" };
        
        const response = await apiRequest("POST", endpoint, body);
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("No client secret received");
        }
      } catch (err: any) {
        console.error("Error fetching client secret:", err);
        setError(err.message || "Failed to initialize checkout");
      } finally {
        setLoading(false);
      }
    };

    fetchClientSecret();
  }, [planId, billingCycle, price, trial]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          <span className="text-lg text-gray-300">Loading checkout...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading checkout</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">Unable to load checkout form</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          clientSecret,
        }}
      >
        <EmbeddedCheckout className="min-h-[600px]" />
      </EmbeddedCheckoutProvider>
    </div>
  );
}