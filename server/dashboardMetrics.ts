export type DashboardCampaign = { contactedCount: number; replyCount: number; qualifiedCount: number };
export type DashboardConversation = { intent: string; status: string };
export type DashboardReplyDraft = { status: string };

export function buildDashboardMetrics(campaigns: DashboardCampaign[], conversations: DashboardConversation[], replyDrafts: DashboardReplyDraft[]) {
  const sum = (key: keyof DashboardCampaign) => campaigns.reduce((total, campaign) => total + campaign[key], 0);
  return {
    outreachSent: sum("contactedCount"),
    replies: sum("replyCount"),
    qualifiedLeads: sum("qualifiedCount"),
    highPriorityConversations: conversations.filter((conversation) => conversation.intent === "Needs Human" || conversation.status === "escalated").length,
    newOpportunities: conversations.filter((conversation) => ["Interested", "Partner", "Investor"].includes(conversation.intent)).length,
    contentPublished: replyDrafts.filter((draft) => draft.status === "approved").length,
  };
}
