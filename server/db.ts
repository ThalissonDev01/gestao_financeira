import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, accounts, transactions, payables, receivables, cashFlow, reports } from "../drizzle/schema";
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

// ===== CATEGORIES =====
export async function getCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.userId, userId)).orderBy(asc(categories.name));
}

export async function createCategory(userId: number, data: Omit<typeof categories.$inferInsert, 'userId' | 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values({ ...data, userId });
  return result;
}

export async function updateCategory(id: number, userId: number, data: Partial<typeof categories.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(categories).set(data).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

export async function deleteCategory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

// ===== ACCOUNTS =====
export async function getAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accounts).where(eq(accounts.userId, userId)).orderBy(asc(accounts.name));
}

export async function getAccountById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createAccount(userId: number, data: Omit<typeof accounts.$inferInsert, 'userId' | 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(accounts).values({ ...data, userId });
}

export async function updateAccount(id: number, userId: number, data: Partial<typeof accounts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(accounts).set(data).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
}

export async function deleteAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
}

// ===== TRANSACTIONS =====
export async function getTransactions(userId: number, filters?: { accountId?: number; categoryId?: number; type?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(transactions.userId, userId)];
  
  if (filters?.accountId) {
    conditions.push(eq(transactions.accountId, filters.accountId));
  }
  if (filters?.categoryId) {
    conditions.push(eq(transactions.categoryId, filters.categoryId));
  }
  if (filters?.type) {
    conditions.push(eq(transactions.type, filters.type as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(transactions.transactionDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(transactions.transactionDate, filters.endDate));
  }
  
  return db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.transactionDate));
}

export async function createTransaction(userId: number, data: Omit<typeof transactions.$inferInsert, 'userId' | 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(transactions).values({ ...data, userId });
}

export async function updateTransaction(id: number, userId: number, data: Partial<typeof transactions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(transactions).set(data).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function deleteTransaction(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

// ===== PAYABLES =====
export async function getPayables(userId: number, filters?: { status?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(payables.userId, userId)];
  
  if (filters?.status) {
    conditions.push(eq(payables.status, filters.status as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(payables.dueDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(payables.dueDate, filters.endDate));
  }
  
  return db.select().from(payables).where(and(...conditions)).orderBy(asc(payables.dueDate));
}

export async function createPayable(userId: number, data: Omit<typeof payables.$inferInsert, 'userId' | 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(payables).values({ ...data, userId });
}

export async function updatePayable(id: number, userId: number, data: Partial<typeof payables.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(payables).set(data).where(and(eq(payables.id, id), eq(payables.userId, userId)));
}

// ===== RECEIVABLES =====
export async function getReceivables(userId: number, filters?: { status?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(receivables.userId, userId)];
  
  if (filters?.status) {
    conditions.push(eq(receivables.status, filters.status as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(receivables.dueDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(receivables.dueDate, filters.endDate));
  }
  
  return db.select().from(receivables).where(and(...conditions)).orderBy(asc(receivables.dueDate));
}

export async function createReceivable(userId: number, data: Omit<typeof receivables.$inferInsert, 'userId' | 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(receivables).values({ ...data, userId });
}

export async function updateReceivable(id: number, userId: number, data: Partial<typeof receivables.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(receivables).set(data).where(and(eq(receivables.id, id), eq(receivables.userId, userId)));
}

// ===== CASH FLOW =====
export async function getCashFlowData(userId: number, filters?: { startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(cashFlow.userId, userId)];
  
  if (filters?.startDate) {
    conditions.push(gte(cashFlow.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(cashFlow.date, filters.endDate));
  }
  
  return db.select().from(cashFlow).where(and(...conditions)).orderBy(asc(cashFlow.date));
}

export async function createCashFlowEntry(userId: number, data: Omit<typeof cashFlow.$inferInsert, 'userId' | 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(cashFlow).values({ ...data, userId });
}

// ===== REPORTS =====
export async function getReports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.createdAt));
}

export async function createReport(userId: number, data: Omit<typeof reports.$inferInsert, 'userId' | 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reports).values({ ...data, userId });
}

export async function deleteReport(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(reports).where(and(eq(reports.id, id), eq(reports.userId, userId)));
}
