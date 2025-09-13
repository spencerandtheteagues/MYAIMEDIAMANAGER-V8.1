import React, { useState } from "react";
import { TrialCards } from "../components/TrialCards";
import { TrialMeter } from "../components/TrialMeter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function TrialPage() {
  const [, setLocation] = useLocation();
  const [selecting, setSelecting] = useState(false);
  const { toast } = useToast();
  
  // Check if user is authenticated
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });
  
  // Handle trial selection
  const handleTrialSelect = async (variant: string) => {
    if (!user) {
      // Not logged in - redirect to auth
      setLocation('/auth');
      return;
    }
    
    if (variant === "card14") {
      // Pro trial - create Stripe checkout session
      setSelecting(true);
      try {
        const response = await fetch("/api/billing/start-pro-trial", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Failed to create checkout session");
        }
        
        const data = await response.json();
        
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to start checkout",
          variant: "destructive"
        });
        setSelecting(false);
      }
    } else {
      // Lite trial - already assigned on signup
      setLocation('/');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 py-12">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Free Trial</h1>
          <p className="text-gray-300 text-lg">
            {user ? "Select your trial plan" : "Sign in to activate your free trial"}
          </p>
        </div>
        <TrialCards 
          onSelect={handleTrialSelect}
          isLoading={selecting}
        />
        <div className="text-center mt-8">
          <Button 
            onClick={() => setLocation('/auth')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-sign-in-trial"
          >
            Sign In to Start Trial
          </Button>
        </div>
      </div>
    </div>
  );
}