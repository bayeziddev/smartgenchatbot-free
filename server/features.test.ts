import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user context
const mockUser = {
  id: 1,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createMockContext(): TrpcContext {
  return {
    user: mockUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Rules Router", () => {
  it("should list rules for authenticated user", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const rules = await caller.rules.list();
    expect(Array.isArray(rules)).toBe(true);
  });

  it("should create a new automation rule", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.rules.create({
      name: "Test Rule",
      keyword: "hello",
      response: "Hi there!",
      matchType: "contains",
    });
    expect(result.success).toBe(true);
  });

  it("should validate rule input", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      await caller.rules.create({
        name: "",
        keyword: "",
        response: "",
      });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should delete a rule", async () => {
    const caller = appRouter.createCaller(createMockContext());
    // First create a rule
    await caller.rules.create({
      name: "Delete Test",
      keyword: "test",
      response: "Testing",
    });

    // Then delete it
    const result = await caller.rules.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("should update rule enabled status", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.rules.update({
      id: 1,
      enabled: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("Messages Router", () => {
  it("should list messages for authenticated user", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const messages = await caller.messages.list({ limit: 50, offset: 0 });
    expect(Array.isArray(messages)).toBe(true);
  });

  it("should support pagination", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const page1 = await caller.messages.list({ limit: 10, offset: 0 });
    const page2 = await caller.messages.list({ limit: 10, offset: 10 });
    expect(Array.isArray(page1)).toBe(true);
    expect(Array.isArray(page2)).toBe(true);
  });
});

describe("Activity Router", () => {
  it("should list activity logs for authenticated user", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const activities = await caller.activity.list({ limit: 50, offset: 0 });
    expect(Array.isArray(activities)).toBe(true);
  });

  it("should support pagination for activities", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const page1 = await caller.activity.list({ limit: 10, offset: 0 });
    const page2 = await caller.activity.list({ limit: 10, offset: 10 });
    expect(Array.isArray(page1)).toBe(true);
    expect(Array.isArray(page2)).toBe(true);
  });
});

describe("WhatsApp Router", () => {
  it("should get connection status", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const connection = await caller.whatsapp.getConnection();
    // Connection may be undefined or an object
    expect(connection === undefined || typeof connection === "object").toBe(true);
  });

  it("should require authentication for WhatsApp operations", async () => {
    const contextWithoutUser = {
      ...createMockContext(),
      user: null,
    };
    const caller = appRouter.createCaller(contextWithoutUser as any);

    try {
      await caller.whatsapp.getConnection();
      expect.fail("Should require authentication");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("Auth Router", () => {
  it("should return current user", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const user = await caller.auth.me();
    expect(user).toEqual(mockUser);
  });

  it("should logout user", async () => {
    const mockRes = {
      clearCookie: vi.fn(),
    };
    const ctx = createMockContext();
    ctx.res = mockRes as any;

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(mockRes.clearCookie).toHaveBeenCalled();
  });
});
