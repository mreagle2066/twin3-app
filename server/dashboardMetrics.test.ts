import { describe, expect, it } from "vitest";
import { buildDashboardMetrics } from "./dashboardMetrics";

describe("buildDashboardMetrics", () => {
  it("includes newly created campaign records in dashboard pipeline totals", () => {
    const metrics = buildDashboardMetrics(
      [
        { contactedCount: 18, replyCount: 4, qualifiedCount: 2 },
        { contactedCount: 7, replyCount: 2, qualifiedCount: 1 },
      ],
      [
        { intent: "Interested", status: "open" },
        { intent: "Needs Human", status: "escalated" },
      ],
      [{ status: "approved" }, { status: "draft" }],
    );

    expect(metrics).toEqual({ outreachSent: 25, replies: 6, qualifiedLeads: 3, highPriorityConversations: 1, newOpportunities: 1, contentPublished: 1 });
  });
});
