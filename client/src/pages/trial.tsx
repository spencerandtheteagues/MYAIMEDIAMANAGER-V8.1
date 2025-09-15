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
  
  // Handle trial selection
  const handleTrialSelect = async (variant: string) => {
    // Always redirect to auth first - users need to be logged in to start trials
    setLocation('/auth');
    // Note: Actual trial logic will be handled after authentication
    // For now, just redirect all trial selections to auth
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-pink-950 py-12">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Free Trial</h1>
          <p className="text-gray-300 text-lg">Sign in to activate your free trial</p>
        </div>
        <TrialCards 
          onSelect={handleTrialSelect}
          isLoading={selecting}
        />
      </div>
    </div>
  );
}