import React, { useState } from "react";
import { TrialCards } from "../components/TrialCards";
import { TrialMeter } from "../components/TrialMeter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";

export default function TrialPage() {
  const [selecting, setSelecting] = useState(false);
  
  const { data: status } = useQuery({
    queryKey: ["/api/trial/status"]
  });
  
  const selectTrial = useMutation({
    mutationFn: async (variant: string) => {
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
  
  if (!status) return <div>Loading...</div>;
  
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