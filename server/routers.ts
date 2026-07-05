import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  whatsapp: router({
    getConnection: protectedProcedure.query(async ({ ctx }) => {
      const { getWhatsappConnection } = await import("./db");
      return getWhatsappConnection(ctx.user.id);
    }),

    initConnection: protectedProcedure.mutation(async ({ ctx }) => {
      const { initializeWhatsAppConnection } = await import("./whatsapp");
      let currentQR = "";
      try {
        await initializeWhatsAppConnection(ctx.user.id, (qr) => {
          currentQR = qr;
        });
        return { success: true, qrCode: currentQR };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to initialize connection"
        );
      }
    }),

    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const { disconnectWhatsApp } = await import("./whatsapp");
      await disconnectWhatsApp(ctx.user.id);
      return { success: true };
    }),

    sendMessage: protectedProcedure
      .input(
        z.object({
          recipient: z.string().trim().min(1, "Recipient is required"),
          message: z.string().trim().min(1, "Message is required").max(4096),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { sendManualMessage } = await import("./whatsapp");
        await sendManualMessage(ctx.user.id, input.recipient, input.message);
        return { success: true };
      }),
  }),

  rules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserRules } = await import("./db");
      return getUserRules(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1, "Rule name is required").max(255),
          keyword: z.string().trim().min(1, "Keyword is required").max(255),
          response: z.string().trim().min(1, "Response is required").max(4096),
          matchType: z
            .enum(["exact", "contains", "startsWith", "endsWith"])
            .optional()
            .default("contains"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createRule } = await import("./db");
        await createRule({
          userId: ctx.user.id,
          name: input.name,
          keyword: input.keyword,
          response: input.response,
          matchType: input.matchType,
          enabled: true,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().trim().min(1).max(255).optional(),
          keyword: z.string().trim().min(1).max(255).optional(),
          response: z.string().trim().min(1).max(4096).optional(),
          matchType: z
            .enum(["exact", "contains", "startsWith", "endsWith"])
            .optional(),
          enabled: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateRule } = await import("./db");
        const { id, ...data } = input;
        await updateRule(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteRule } = await import("./db");
        await deleteRule(input.id);
        return { success: true };
      }),
  }),

  messages: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const { getUserMessages } = await import("./db");
        return getUserMessages(ctx.user.id, input.limit, input.offset);
      }),
  }),

  activity: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const { getUserActivityLogs } = await import("./db");
        return getUserActivityLogs(ctx.user.id, input.limit, input.offset);
      }),
  }),
});

export type AppRouter = typeof appRouter;
