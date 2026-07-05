import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  whatsappConnections,
  InsertWhatsappConnection,
  automationRules,
  InsertAutomationRule,
  messages,
  InsertMessage,
  activityLogs,
  InsertActivityLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// WhatsApp Connection helpers
export async function getWhatsappConnection(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(whatsappConnections)
    .where(eq(whatsappConnections.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertWhatsappConnection(
  userId: number,
  data: Partial<InsertWhatsappConnection>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(whatsappConnections)
    .values({ userId, ...data })
    .onDuplicateKeyUpdate({
      set: data,
    });
}

// Automation Rules helpers
export async function getUserRules(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(automationRules)
    .where(eq(automationRules.userId, userId));
}

export async function createRule(rule: InsertAutomationRule) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(automationRules).values(rule);
  return result;
}

export async function updateRule(
  ruleId: number,
  data: Partial<InsertAutomationRule>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(automationRules)
    .set(data)
    .where(eq(automationRules.id, ruleId));
}

export async function deleteRule(ruleId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(automationRules).where(eq(automationRules.id, ruleId));
}

// Message helpers
export async function saveMessage(msg: InsertMessage) {
  const db = await getDb();
  if (!db) return;
  await db.insert(messages).values(msg);
}

export async function getUserMessages(
  userId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(desc(messages.timestamp))
    .limit(limit)
    .offset(offset);
}

// Activity Log helpers
export async function logActivity(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(log);
}

export async function getUserActivityLogs(
  userId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getActivityLogsByRule(ruleId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.ruleId, ruleId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}
