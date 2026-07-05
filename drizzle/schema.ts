import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * WhatsApp connections - stores session data and connection status
 */
export const whatsappConnections = mysqlTable("whatsapp_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  status: mysqlEnum("status", ["disconnected", "connecting", "connected", "error"]).default("disconnected").notNull(),
  sessionData: text("sessionData"), // Encrypted Baileys session JSON
  qrCode: text("qrCode"), // Current QR code as data URL
  lastConnectedAt: timestamp("lastConnectedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappConnection = typeof whatsappConnections.$inferSelect;
export type InsertWhatsappConnection = typeof whatsappConnections.$inferInsert;

/**
 * Automation rules - keyword triggers with automated responses
 */
export const automationRules = mysqlTable("automation_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  response: text("response").notNull(),
  matchType: mysqlEnum("matchType", ["exact", "contains", "startsWith", "endsWith"]).default("contains").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

/**
 * WhatsApp messages - incoming and outgoing messages
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  messageId: varchar("messageId", { length: 255 }).notNull(),
  sender: varchar("sender", { length: 255 }).notNull(),
  senderName: varchar("senderName", { length: 255 }),
  content: text("content").notNull(),
  direction: mysqlEnum("direction", ["incoming", "outgoing"]).notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(), // Unix timestamp in ms
  isAutomated: boolean("isAutomated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Activity logs - record of automated rule executions
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ruleId: int("ruleId").notNull(),
  messageId: varchar("messageId", { length: 255 }).notNull(),
  contact: varchar("contact", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  matchedKeyword: varchar("matchedKeyword", { length: 255 }).notNull(),
  sentResponse: text("sentResponse").notNull(),
  status: mysqlEnum("status", ["success", "failed"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;