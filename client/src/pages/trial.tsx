import React, { useState } from "react";
import { TrialCards } from "../components/TrialCards";
import { TrialMeter } from "../components/TrialMeter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { Button } from "@/components/ui/button";

export default function TrialPage() {
  const [selecting, setSelecting] = useState(false);
  
  // Immediately show trial selection page for unauthenticated users
  // Don't check authentication status - let user click to sign in
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
            data-testid="button-sign-in-trial"
          >
            Sign In to Start Trial
          </Button>
        </div>
      </div>
    </div>
  );
}