import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AGENT_MODES, INTENT_LABELS, OPPORTUNITY_TAGS } from "../agentConstants";
import * as db from "../db";
import { invokeLLM, listLLMModels } from "../_core/llm";
import { disconnectXAccount, getActiveXAccessToken } from "../xOAuth";
import { protectedProcedure, router } from "../_core/trpc";

const agentMode = z.enum(AGENT_MODES);
const opportunityTag = z.enum(OPPORTUNITY_TAGS);

function dbError(error: unknown): never {
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : "The workspace could not be loaded." });
}

async function preferredModel() {
  const { data } = await listLLMModels();
  return data.find((model) => model.id === "gpt-5-mini")?.id ?? data[0]?.id;
}

export const growthRouter = router({
  // X network boundary: only actions that verify an X identity or activate/schedule X activity
  // require getActiveXAccessToken. Drafts, AI drafting, local lead research, knowledge, and
  // safety configuration remain local-only until a user explicitly triggers an X action.
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    try { return await db.getDashboard(ctx.user.id); } catch (error) { return dbError(error); }
  }),
  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try { return await db.listCampaigns(ctx.user.id); } catch (error) { return dbError(error); }
    }),
    create: protectedProcedure.input(z.object({ name: z.string().min(2).max(160), targetAudience: z.string().min(4).max(600), dailyLimit: z.number().int().min(1).max(500), status: z.enum(["draft", "scheduled", "active", "paused"]).default("draft") })).mutation(async ({ ctx, input }) => {
      try {
        if (input.status !== "draft") await getActiveXAccessToken(ctx.user.id);
        return await db.createCampaign(ctx.user.id, input);
      } catch (error) { return dbError(error); }
    }),
  }),
  leads: router({
    list: protectedProcedure.input(z.object({ search: z.string().max(160).optional(), opportunityTag: opportunityTag.optional(), minScore: z.number().int().min(0).max(100).optional() }).optional()).query(async ({ ctx, input }) => {
      try { return await db.listLeads(ctx.user.id, input ?? {}); } catch (error) { return dbError(error); }
    }),
    create: protectedProcedure.input(z.object({ name: z.string().min(2).max(160), handle: z.string().min(2).max(80), category: z.string().min(2).max(120), audienceSize: z.number().int().min(0), relevance: z.number().int().min(0).max(100), interestLevel: z.enum(["low", "medium", "high"]), leadScore: z.number().int().min(0).max(100), opportunityTag: opportunityTag.optional(), location: z.string().max(120).optional(), bio: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      try { return await db.createLead(ctx.user.id, input); } catch (error) { return dbError(error); }
    }),
  }),
  knowledgeBase: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try { return await db.listKnowledgeBase(ctx.user.id); } catch (error) { return dbError(error); }
    }),
    create: protectedProcedure.input(z.object({ category: z.enum(["company", "product", "vision", "faq", "tone", "restricted"]), title: z.string().min(2).max(160), content: z.string().min(2).max(5000), isRestricted: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      try { return await db.saveKnowledgeBaseEntry(ctx.user.id, input); } catch (error) { return dbError(error); }
    }),
  }),
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try { return await db.listConversations(ctx.user.id); } catch (error) { return dbError(error); }
    }),
    history: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      try { return await db.getConversationHistory(ctx.user.id, input.conversationId); } catch (error) { return dbError(error); }
    }),
    escalate: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), reason: z.string().min(5).max(1000) })).mutation(async ({ ctx, input }) => {
      try { return await db.escalateConversation(ctx.user.id, input.conversationId, input.reason); } catch (error) { return dbError(error); }
    }),
  }),
  replyDrafts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try { return await db.listReplyDrafts(ctx.user.id); } catch (error) { return dbError(error); }
    }),
    create: protectedProcedure.input(z.object({ targetName: z.string().min(2).max(160), targetHandle: z.string().min(2).max(80), sourcePost: z.string().min(8).max(1000), draft: z.string().min(5).max(1000) })).mutation(async ({ ctx, input }) => {
      try { return await db.createReplyDraft(ctx.user.id, input); } catch (error) { return dbError(error); }
    }),
    review: protectedProcedure.input(z.object({ draftId: z.number().int().positive(), status: z.enum(["approved", "rejected"]) })).mutation(async ({ ctx, input }) => {
      try { return await db.reviewReplyDraft(ctx.user.id, input.draftId, input.status); } catch (error) { return dbError(error); }
    }),
  }),
  monitoredAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try { return await db.listMonitoredAccounts(ctx.user.id); } catch (error) { return dbError(error); }
    }),
    create: protectedProcedure.input(z.object({ accountName: z.string().min(2).max(160), handle: z.string().min(2).max(80), category: z.string().min(2).max(120) })).mutation(async ({ ctx, input }) => {
      try { return await db.createMonitoredAccount(ctx.user.id, input); } catch (error) { return dbError(error); }
    }),
  }),
  contentDrafts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try { return await db.listContentDrafts(ctx.user.id); } catch (error) { return dbError(error); }
    }),
    create: protectedProcedure.input(z.object({ theme: z.string().min(2).max(160), content: z.string().min(5).max(2000) })).mutation(async ({ ctx, input }) => {
      try { return await db.createContentDraft(ctx.user.id, input); } catch (error) { return dbError(error); }
    }),
    review: protectedProcedure.input(z.object({ draftId: z.number().int().positive(), status: z.enum(["approved", "rejected"]) })).mutation(async ({ ctx, input }) => {
      try { return await db.reviewContentDraft(ctx.user.id, input.draftId, input.status); } catch (error) { return dbError(error); }
    }),
  }),
  safety: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      try { return await db.getSafetyControls(ctx.user.id); } catch (error) { return dbError(error); }
    }),
    save: protectedProcedure.input(z.object({ outreachDmsPerDay: z.number().int().min(1).max(500), repliesPerHour: z.number().int().min(1).max(100), postsPerDay: z.number().int().min(1).max(30), outreachMode: agentMode, conversationMode: agentMode, replyMode: agentMode, autoPauseThreshold: z.number().int().min(50).max(100) })).mutation(async ({ ctx, input }) => {
      try { return await db.saveSafetyControls(ctx.user.id, input); } catch (error) { return dbError(error); }
    }),
  }),
  xAccount: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      try {
        const account = await db.getXAccount(ctx.user.id);
        return account ? { connected: true as const, username: account.username, displayName: account.displayName, connectedAt: account.connectedAt, scopes: account.scopes } : { connected: false as const };
      } catch (error) { return dbError(error); }
    }),
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      try { return await disconnectXAccount(ctx.user.id); } catch (error) { return dbError(error); }
    }),
    verifyAccess: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const accessToken = await getActiveXAccessToken(ctx.user.id);
        const response = await fetch("https://api.x.com/2/users/me", { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!response.ok) throw new Error("X could not verify the connected account. Please reconnect it in Safety & Controls.");
        const body = await response.json() as { data?: { username?: string } };
        return { verified: true as const, username: body.data?.username ?? null };
      } catch (error) { return dbError(error); }
    }),
  }),
  ai: router({
    generateVariations: protectedProcedure.input(z.object({ audience: z.string().min(3).max(600), message: z.string().min(10).max(1200) })).mutation(async ({ input }) => {
      const model = await preferredModel();
      const result = await invokeLLM({
        model,
        max_tokens: 900,
        messages: [
          { role: "system", content: "You write respectful, concise X outreach. Produce exactly three variations in a JSON object with a variations string array. Never make investment promises, legal commitments, financial commitments, partnership promises, or claims not provided. Do not pressure recipients or use spammy language." },
          { role: "user", content: `Target audience: ${input.audience}\nBase message: ${input.message}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "outreach_variations", strict: true, schema: { type: "object", properties: { variations: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 } }, required: ["variations"], additionalProperties: false } } },
      });
      const content = result.choices[0]?.message.content;
      if (!content || typeof content !== "string") throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The variation generator did not return content." });
      return JSON.parse(content) as { variations: string[] };
    }),
    draftConversationResponse: protectedProcedure.input(z.object({ incomingMessage: z.string().min(3).max(2000) })).mutation(async ({ ctx, input }) => {
      const entries = await db.listKnowledgeBase(ctx.user.id);
      const approvedKnowledge = entries.filter((entry) => !entry.isRestricted).map((entry) => `## ${entry.title}\n${entry.content}`).join("\n\n") || "No approved knowledge base content is available.";
      const model = await preferredModel();
      const result = await invokeLLM({
        model,
        max_tokens: 800,
        messages: [
          { role: "system", content: "You are the Conversation Agent for a Web3 growth platform. Draft a concise, helpful response only from the approved knowledge base supplied. If the question needs confidential details, legal terms, investment promises, fundraising negotiation, a partnership promise, or knowledge not provided, explain that a team member will follow up and do not invent details. Never reference the policy or the knowledge base." },
          { role: "user", content: `Approved knowledge base:\n${approvedKnowledge}\n\nIncoming message:\n${input.incomingMessage}` },
        ],
      });
      const draft = result.choices[0]?.message.content;
      if (!draft) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The drafting agent did not return content." });
      return { draft };
    }),
  }),
  configuration: protectedProcedure.query(() => ({ intents: INTENT_LABELS, opportunityTags: OPPORTUNITY_TAGS, agentModes: AGENT_MODES })),
});
