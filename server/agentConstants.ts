export const INTENT_LABELS = ["Interested", "Partner", "Investor", "General", "Not Interested", "Spam", "Needs Human"] as const;
export const OPPORTUNITY_TAGS = ["potential user", "partner", "investor", "KOL"] as const;
export const AGENT_MODES = ["Manual", "Semi-autonomous", "Autonomous"] as const;

export type IntentLabel = (typeof INTENT_LABELS)[number];
export type OpportunityTag = (typeof OPPORTUNITY_TAGS)[number];
export type AgentMode = (typeof AGENT_MODES)[number];

export function clampLeadScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function isAutoPublishingAllowed() {
  return false;
}
