import React, { useState } from "react";
import { TrialCards } from "../components/TrialCards";
import { TrialMeter } from "../components/TrialMeter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { Button } from "@/components/ui/button";

export default function TrialPage() {
  const [selecting, setSelecting] = useState(false);
  
  // Check if user is authenticated first
  const { data: user, error: userError, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
  
  // Only fetch trial status if user is authenticated
  const { data: status, isLoading } = useQuery({
    queryKey: ["/api/trial/status"],
    enabled: !!user, // Only run this query if user is authenticated
    retry: false,
  });
  
  const selectTrial = useMutation({
    mutationFn: async (variant: string) => {
      // If not authenticated, redirect to login
      if (!user) {
        window.location.href = '/api/login';
        return;
      }
      
      const res = await fetch("/api/trial/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant })
      });
      if (!res.ok) throw new Error("Failed to select trial");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trial/status"] });
      setSelecting(false);
    }
  });
  
  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }
  
  // If not authenticated or there's an error, show trial selection with sign-in prompts
  if (!user || userError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 py-12">
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Choose Your Free Trial</h1>
            <p className="text-gray-300 text-lg">Sign in to activate your 7-day free trial</p>
          </div>
          <TrialCards onSelect={(variant) => {
            // Redirect to login when trial is selected
            window.location.href = '/api/login';
          }} />
          <div className="text-center mt-8">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Sign In to Start Trial
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If authenticated and loading trial status
  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  
  if (status.variant && !selecting) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Your Trial Status</h1>
        <div className="bg-zinc-900 rounded-2xl p-8 space-y-6">
          <div>
            <p className="text-zinc-400">Trial Type</p>
            <p className="text-xl font-semibold">{status.variant === "nocard7" ? "Lite Trial" : "Pro Trial"}</p>
          </div>
          <div>
            <p className="text-zinc-400">Ends</p>
            <p className="text-xl">{new Date(status.endsAt).toLocaleDateString()}</p>
          </div>
          <div className="space-y-4">
            <TrialMeter 
              used={6 - status.imagesRemaining} 
              total={6} 
              label="AI Images" 
            />
            {status.videosRemaining > 0 && (
              <TrialMeter 
                used={3 - status.videosRemaining} 
                total={3} 
                label="AI Videos" 
              />
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Choose Your Trial</h1>
      <TrialCards onSelect={(id) => selectTrial.mutate(id)} />
    </div>
  );
}