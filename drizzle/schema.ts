import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  targetAudience: text("targetAudience").notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "active", "paused"]).default("draft").notNull(),
  leadCount: int("leadCount").default(0).notNull(),
  contactedCount: int("contactedCount").default(0).notNull(),
  replyCount: int("replyCount").default(0).notNull(),
  qualifiedCount: int("qualifiedCount").default(0).notNull(),
  dailyLimit: int("dailyLimit").default(30).notNull(),
  scheduledFor: timestamp("scheduledFor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  handle: varchar("handle", { length: 80 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  bio: text("bio"),
  location: varchar("location", { length: 120 }),
  audienceSize: int("audienceSize").default(0).notNull(),
  relevance: int("relevance").default(0).notNull(),
  interestLevel: mysqlEnum("interestLevel", ["low", "medium", "high"]).default("medium").notNull(),
  leadScore: int("leadScore").default(0).notNull(),
  opportunityTag: mysqlEnum("opportunityTag", ["potential user", "partner", "investor", "KOL"]),
  status: mysqlEnum("status", ["new", "contacted", "replied", "qualified", "human_follow_up"]).default("new").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const knowledgeBaseEntries = mysqlTable("knowledgeBaseEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", ["company", "product", "vision", "faq", "tone", "restricted"]).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  content: text("content").notNull(),
  isRestricted: boolean("isRestricted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"),
  contactName: varchar("contactName", { length: 160 }).notNull(),
  contactHandle: varchar("contactHandle", { length: 80 }).notNull(),
  preview: text("preview").notNull(),
  intent: mysqlEnum("intent", ["Interested", "Partner", "Investor", "General", "Not Interested", "Spam", "Needs Human"]).default("General").notNull(),
  status: mysqlEnum("status", ["open", "escalated", "closed"]).default("open").notNull(),
  escalationReason: text("escalationReason"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const conversationMessages = mysqlTable("conversationMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  sender: mysqlEnum("sender", ["contact", "agent", "human"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const replyDrafts = mysqlTable("replyDrafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetName: varchar("targetName", { length: 160 }).notNull(),
  targetHandle: varchar("targetHandle", { length: 80 }).notNull(),
  sourcePost: text("sourcePost").notNull(),
  draft: text("draft").notNull(),
  status: mysqlEnum("status", ["draft", "approved", "rejected"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const safetyControls = mysqlTable("safetyControls", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  outreachDmsPerDay: int("outreachDmsPerDay").default(30).notNull(),
  repliesPerHour: int("repliesPerHour").default(12).notNull(),
  postsPerDay: int("postsPerDay").default(2).notNull(),
  outreachMode: mysqlEnum("outreachMode", ["Manual", "Semi-autonomous", "Autonomous"]).default("Manual").notNull(),
  conversationMode: mysqlEnum("conversationMode", ["Manual", "Semi-autonomous", "Autonomous"]).default("Manual").notNull(),
  replyMode: mysqlEnum("replyMode", ["Manual", "Semi-autonomous", "Autonomous"]).default("Manual").notNull(),
  autoPauseThreshold: int("autoPauseThreshold").default(85).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const monitoredAccounts = mysqlTable("monitoredAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountName: varchar("accountName", { length: 160 }).notNull(),
  handle: varchar("handle", { length: 80 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const contentDrafts = mysqlTable("contentDrafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  theme: varchar("theme", { length: 160 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["draft", "approved", "rejected"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const xAccounts = mysqlTable("xAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  xUserId: varchar("xUserId", { length: 80 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull(),
  displayName: varchar("displayName", { length: 160 }),
  accessTokenCiphertext: text("accessTokenCiphertext").notNull(),
  refreshTokenCiphertext: text("refreshTokenCiphertext"),
  scopes: text("scopes").notNull(),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
