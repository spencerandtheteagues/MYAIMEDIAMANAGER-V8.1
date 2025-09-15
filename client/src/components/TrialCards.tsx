import React from "react";
import { TRIAL_CARDS } from "../config/trials";

export function TrialCards({ onSelect, isLoading }:{ onSelect:(id:string)=>void, isLoading?: boolean }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {TRIAL_CARDS.map(card => (
        <div key={card.id} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <h3 className="text-xl font-semibold">{card.name}</h3>
          <p className="text-zinc-400 mt-1">{card.subtitle}</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {card.bullets.map((b,i)=><li key={i}>• {b}</li>)}
          </ul>
          <button
            onClick={()=>onSelect(card.id)}
            disabled={isLoading}
            className="mt-5 w-full py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : card.primaryCta}
          </button>
          <p className="mt-3 text-xs text-zinc-500">{card.footnote}</p>
        </div>
      ))}
    </div>
  );
}