import { describe, expect, it } from "vitest";
import { clampLeadScore, INTENT_LABELS, isAutoPublishingAllowed, OPPORTUNITY_TAGS } from "./agentConstants";

describe("Twin3 operating safeguards", () => {
  it("retains the product's exact intent and opportunity vocabulary", () => {
    expect(INTENT_LABELS).toEqual(["Interested", "Partner", "Investor", "General", "Not Interested", "Spam", "Needs Human"]);
    expect(OPPORTUNITY_TAGS).toEqual(["potential user", "partner", "investor", "KOL"]);
  });

  it("keeps every lead score on the 0–100 scale", () => {
    expect(clampLeadScore(-14)).toBe(0);
    expect(clampLeadScore(71.5)).toBe(72);
    expect(clampLeadScore(191)).toBe(100);
  });

  it("does not allow auto-publishing by default", () => {
    expect(isAutoPublishingAllowed()).toBe(false);
  });
});

