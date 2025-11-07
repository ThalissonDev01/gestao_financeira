import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== CATEGORIES =====
  categories: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getCategories(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["income", "expense"]),
        color: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createCategory(ctx.user.id, input)
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["income", "expense"]).optional(),
        color: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateCategory(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteCategory(input.id, ctx.user.id)
      ),
  }),

  // ===== ACCOUNTS =====
  accounts: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getAccounts(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getAccountById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["bank", "credit_card", "cash", "investment"]),
        balance: z.string().optional(),
        initialBalance: z.string().optional(),
        currency: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createAccount(ctx.user.id, input)
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["bank", "credit_card", "cash", "investment"]).optional(),
        balance: z.string().optional(),
        currency: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateAccount(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteAccount(input.id, ctx.user.id)
      ),
  }),

  // ===== TRANSACTIONS =====
  transactions: router({
    list: protectedProcedure
      .input(z.object({
        accountId: z.number().optional(),
        categoryId: z.number().optional(),
        type: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ ctx, input }) =>
        db.getTransactions(ctx.user.id, input)
      ),
    create: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        categoryId: z.number().optional(),
        description: z.string().min(1),
        amount: z.string(),
        type: z.enum(["income", "expense"]),
        status: z.enum(["pending", "completed", "cancelled"]).optional(),
        transactionDate: z.date(),
        dueDate: z.date().optional(),
        paymentDate: z.date().optional(),
        notes: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createTransaction(ctx.user.id, input)
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        amount: z.string().optional(),
        type: z.enum(["income", "expense"]).optional(),
        status: z.enum(["pending", "completed", "cancelled"]).optional(),
        transactionDate: z.date().optional(),
        dueDate: z.date().optional(),
        paymentDate: z.date().optional(),
        notes: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateTransaction(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteTransaction(input.id, ctx.user.id)
      ),
  }),

  // ===== PAYABLES =====
  payables: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ ctx, input }) =>
        db.getPayables(ctx.user.id, input)
      ),
    create: protectedProcedure
      .input(z.object({
        transactionId: z.number().optional(),
        description: z.string().min(1),
        amount: z.string(),
        dueDate: z.date(),
        paymentDate: z.date().optional(),
        status: z.enum(["pending", "partial", "paid", "overdue", "cancelled"]).optional(),
        paymentMethod: z.enum(["cash", "check", "bank_transfer", "credit_card", "debit_card", "other"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createPayable(ctx.user.id, input)
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        amount: z.string().optional(),
        dueDate: z.date().optional(),
        paymentDate: z.date().optional(),
        status: z.enum(["pending", "partial", "paid", "overdue", "cancelled"]).optional(),
        paymentMethod: z.enum(["cash", "check", "bank_transfer", "credit_card", "debit_card", "other"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updatePayable(id, ctx.user.id, data);
      }),
  }),

  // ===== RECEIVABLES =====
  receivables: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ ctx, input }) =>
        db.getReceivables(ctx.user.id, input)
      ),
    create: protectedProcedure
      .input(z.object({
        transactionId: z.number().optional(),
        description: z.string().min(1),
        amount: z.string(),
        dueDate: z.date(),
        paymentDate: z.date().optional(),
        status: z.enum(["pending", "partial", "received", "overdue", "cancelled"]).optional(),
        paymentMethod: z.enum(["cash", "check", "bank_transfer", "credit_card", "debit_card", "other"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createReceivable(ctx.user.id, input)
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        amount: z.string().optional(),
        dueDate: z.date().optional(),
        paymentDate: z.date().optional(),
        status: z.enum(["pending", "partial", "received", "overdue", "cancelled"]).optional(),
        paymentMethod: z.enum(["cash", "check", "bank_transfer", "credit_card", "debit_card", "other"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateReceivable(id, ctx.user.id, data);
      }),
  }),

  // ===== CASH FLOW =====
  cashFlow: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ ctx, input }) =>
        db.getCashFlowData(ctx.user.id, input)
      ),
    create: protectedProcedure
      .input(z.object({
        date: z.date(),
        totalIncome: z.string(),
        totalExpense: z.string(),
        netFlow: z.string(),
        openingBalance: z.string(),
        closingBalance: z.string(),
      }))
      .mutation(({ ctx, input }) =>
        db.createCashFlowEntry(ctx.user.id, input)
      ),
  }),

  // ===== REPORTS =====
  reports: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getReports(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        type: z.enum(["income_expense", "cash_flow", "payables", "receivables", "summary"]),
        startDate: z.date(),
        endDate: z.date(),
        data: z.string(),
      }))
      .mutation(({ ctx, input }) =>
        db.createReport(ctx.user.id, input)
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        db.deleteReport(input.id, ctx.user.id)
      ),
  }),
});

export type AppRouter = typeof appRouter;
