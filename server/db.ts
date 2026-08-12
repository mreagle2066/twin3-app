import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  campaigns,
  contentDrafts,
  conversationMessages,
  conversations,
  InsertUser,
  knowledgeBaseEntries,
  leads,
  monitoredAccounts,
  replyDrafts,
  safetyControls,
  users,
  xAccounts,
} from "../drizzle/schema";
import { clampLeadScore } from "./agentConstants";
import { buildDashboardMetrics } from "./dashboardMetrics";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  updateSet.lastSignedIn = values.lastSignedIn;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

function mustDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("Database is unavailable. Please retry shortly.");
  return db;
}

export async function getDashboard(userId: number) {
  const db = mustDb(await getDb());
  const [campaignRows, conversationRows, draftRows] = await Promise.all([
    db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.updatedAt)),
    db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt)),
    db.select().from(replyDrafts).where(eq(replyDrafts.userId, userId)),
  ]);
  return {
    metrics: buildDashboardMetrics(campaignRows, conversationRows, draftRows),
    campaigns: campaignRows,
  };
}

export async function listCampaigns(userId: number) {
  const db = mustDb(await getDb());
  return db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.updatedAt));
}

export async function createCampaign(userId: number, input: { name: string; targetAudience: string; dailyLimit: number; status: "draft" | "scheduled" | "active" | "paused" }) {
  const db = mustDb(await getDb());
  const result = await db.insert(campaigns).values({ userId, ...input });
  return { id: Number(result[0].insertId) };
}

export async function listLeads(userId: number, input: { search?: string; opportunityTag?: "potential user" | "partner" | "investor" | "KOL"; minScore?: number }) {
  const db = mustDb(await getDb());
  const rows = await db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.leadScore));
  const search = input.search?.trim().toLowerCase();
  return rows.filter((lead) => {
    const matchesSearch = !search || `${lead.name} ${lead.handle} ${lead.category}`.toLowerCase().includes(search);
    const matchesTag = !input.opportunityTag || lead.opportunityTag === input.opportunityTag;
    const matchesScore = !input.minScore || lead.leadScore >= input.minScore;
    return matchesSearch && matchesTag && matchesScore;
  });
}

export async function createLead(userId: number, input: { name: string; handle: string; category: string; audienceSize: number; relevance: number; interestLevel: "low" | "medium" | "high"; leadScore: number; opportunityTag?: "potential user" | "partner" | "investor" | "KOL"; location?: string; bio?: string }) {
  const db = mustDb(await getDb());
  const result = await db.insert(leads).values({ userId, ...input, leadScore: clampLeadScore(input.leadScore) });
  return { id: Number(result[0].insertId) };
}

export async function listKnowledgeBase(userId: number) {
  const db = mustDb(await getDb());
  return db.select().from(knowledgeBaseEntries).where(eq(knowledgeBaseEntries.userId, userId)).orderBy(desc(knowledgeBaseEntries.updatedAt));
}

export async function saveKnowledgeBaseEntry(userId: number, input: { category: "company" | "product" | "vision" | "faq" | "tone" | "restricted"; title: string; content: string; isRestricted: boolean }) {
  const db = mustDb(await getDb());
  const result = await db.insert(knowledgeBaseEntries).values({ userId, ...input });
  return { id: Number(result[0].insertId) };
}

export async function listConversations(userId: number) {
  const db = mustDb(await getDb());
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function getConversationHistory(userId: number, conversationId: number) {
  const db = mustDb(await getDb());
  const row = await db.select().from(conversations).where(and(eq(conversations.userId, userId), eq(conversations.id, conversationId))).limit(1);
  if (!row[0]) throw new Error("Conversation not found.");
  const messages = await db.select().from(conversationMessages).where(eq(conversationMessages.conversationId, conversationId)).orderBy(conversationMessages.createdAt);
  return { conversation: row[0], messages };
}

export async function escalateConversation(userId: number, conversationId: number, reason: string) {
  const db = mustDb(await getDb());
  await db.update(conversations).set({ status: "escalated", intent: "Needs Human", escalationReason: reason }).where(and(eq(conversations.userId, userId), eq(conversations.id, conversationId)));
  return { success: true as const };
}

export async function listReplyDrafts(userId: number) {
  const db = mustDb(await getDb());
  return db.select().from(replyDrafts).where(eq(replyDrafts.userId, userId)).orderBy(desc(replyDrafts.updatedAt));
}

export async function createReplyDraft(userId: number, input: { targetName: string; targetHandle: string; sourcePost: string; draft: string }) {
  const db = mustDb(await getDb());
  const result = await db.insert(replyDrafts).values({ userId, ...input, status: "draft" });
  return { id: Number(result[0].insertId) };
}

export async function reviewReplyDraft(userId: number, draftId: number, status: "approved" | "rejected") {
  const db = mustDb(await getDb());
  await db.update(replyDrafts).set({ status }).where(and(eq(replyDrafts.userId, userId), eq(replyDrafts.id, draftId)));
  return { success: true as const };
}

export async function listMonitoredAccounts(userId: number) {
  const db = mustDb(await getDb());
  return db.select().from(monitoredAccounts).where(eq(monitoredAccounts.userId, userId)).orderBy(desc(monitoredAccounts.createdAt));
}

export async function createMonitoredAccount(userId: number, input: { accountName: string; handle: string; category: string }) {
  const db = mustDb(await getDb());
  const result = await db.insert(monitoredAccounts).values({ userId, ...input });
  return { id: Number(result[0].insertId) };
}

export async function listContentDrafts(userId: number) {
  const db = mustDb(await getDb());
  return db.select().from(contentDrafts).where(eq(contentDrafts.userId, userId)).orderBy(desc(contentDrafts.updatedAt));
}

export async function createContentDraft(userId: number, input: { theme: string; content: string }) {
  const db = mustDb(await getDb());
  const result = await db.insert(contentDrafts).values({ userId, ...input, status: "draft" });
  return { id: Number(result[0].insertId) };
}

export async function reviewContentDraft(userId: number, draftId: number, status: "approved" | "rejected") {
  const db = mustDb(await getDb());
  await db.update(contentDrafts).set({ status }).where(and(eq(contentDrafts.userId, userId), eq(contentDrafts.id, draftId)));
  return { success: true as const };
}

export async function getSafetyControls(userId: number) {
  const db = mustDb(await getDb());
  const result = await db.select().from(safetyControls).where(eq(safetyControls.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function saveSafetyControls(userId: number, input: { outreachDmsPerDay: number; repliesPerHour: number; postsPerDay: number; outreachMode: "Manual" | "Semi-autonomous" | "Autonomous"; conversationMode: "Manual" | "Semi-autonomous" | "Autonomous"; replyMode: "Manual" | "Semi-autonomous" | "Autonomous"; autoPauseThreshold: number }) {
  const db = mustDb(await getDb());
  await db.insert(safetyControls).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  return { success: true as const };
}

export async function getUserById(userId: number) {
  const db = mustDb(await getDb());
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function getXAccount(userId: number) {
  const db = mustDb(await getDb());
  const result = await db.select().from(xAccounts).where(eq(xAccounts.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getXAccountByXUserId(xUserId: string) {
  const db = mustDb(await getDb());
  const result = await db.select().from(xAccounts).where(eq(xAccounts.xUserId, xUserId)).limit(1);
  return result[0] ?? null;
}

export async function saveXAccount(userId: number, input: { xUserId: string; username: string; displayName?: string | null; accessTokenCiphertext: string; refreshTokenCiphertext?: string | null; scopes: string; tokenExpiresAt?: Date | null }) {
  const db = mustDb(await getDb());
  await db.insert(xAccounts).values({ userId, ...input }).onDuplicateKeyUpdate({ set: input });
  return getXAccount(userId);
}

export async function deleteXAccount(userId: number) {
  const db = mustDb(await getDb());
  await db.delete(xAccounts).where(eq(xAccounts.userId, userId));
  return { success: true as const };
}
