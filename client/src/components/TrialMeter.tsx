import React from "react";

export function TrialMeter({ used, total, label }:{ used:number; total:number; label:string }) {
  const pct = total > 0 ? Math.min((used/total)*100, 100) : 0;
  const remaining = Math.max(0, total - used);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300">{remaining} left</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-fuchsia-600 to-violet-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}