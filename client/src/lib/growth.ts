export const INTENT_LABELS = ["Interested", "Partner", "Investor", "General", "Not Interested", "Spam", "Needs Human"] as const;
export const OPPORTUNITY_TAGS = ["potential user", "partner", "investor", "KOL"] as const;
export const AGENT_MODES = ["Manual", "Semi-autonomous", "Autonomous"] as const;

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function intentTone(intent: string) {
  if (intent === "Interested") return "bg-cyan-400/10 text-cyan-200 border-cyan-300/20";
  if (intent === "Partner") return "bg-violet-400/10 text-violet-200 border-violet-300/20";
  if (intent === "Investor") return "bg-amber-400/10 text-amber-200 border-amber-300/20";
  if (intent === "Needs Human") return "bg-rose-400/10 text-rose-200 border-rose-300/20";
  if (intent === "Spam") return "bg-slate-400/10 text-slate-300 border-slate-300/20";
  return "bg-white/5 text-slate-300 border-white/10";
}
