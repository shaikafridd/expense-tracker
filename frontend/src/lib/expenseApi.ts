/**
 * expenseApi.ts
 * ─────────────────────────────────────────────────────────────────
 *  Smart data layer: routes to Express/MongoDB backend when authenticated,
 *  otherwise falls back to LocalStorage (demo mode).
 *  The caller never needs to know which backend is active.
 * ─────────────────────────────────────────────────────────────────
 */

import { IS_CONFIGURED } from './supabaseClient';
import { apiFetch, auth } from './apiClient';
import type { Category } from '../types';

/* ── Shared types ────────────────────────────────────────────── */
export interface ExpenseRow {
  id:         string;
  created_at: string;
  user_id:    string;
  title:      string;
  amount:     number;
  category:   Category;
  date:       string;       // "YYYY-MM-DD"
}

export interface CategoryTotal {
  category: Category;
  total:    number;
}

export interface MonthlySummary {
  total_spent: number;
  tx_count:    number;
  avg_per_day: number;
}

/* ── LocalStorage fallback helpers ───────────────────────────── */
const LS_KEY = 'gravity_expenses_v2';

function lsLoad(): ExpenseRow[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ExpenseRow[]) : [];
  } catch {
    return [];
  }
}

function lsSave(rows: ExpenseRow[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

/* ── Error classification ───────────────────────────────────── */

/**
 * True once we've confirmed the DB table exists and is reachable.
 * App.tsx reads this to decide whether to show a setup notice.
 */
export let DB_READY = true; // Default to true in Node.js backend

function raise(ctx: string, err: { message: string }): never {
  throw new Error(`[expenseApi] ${ctx}: ${err.message}`);
}

/* ════════════════════════════════════════════════════════════════
   1. addExpense
   ════════════════════════════════════════════════════════════════ */
export async function addExpense(
  payload: Pick<ExpenseRow, 'title' | 'amount' | 'category' | 'date'>
): Promise<ExpenseRow> {
  const { data: { user } } = await auth.getUser();
  
  // If no authenticated user, fall back to LocalStorage (anonymous demo)
  if (!user) {
    const row: ExpenseRow = {
      ...payload,
      id:         crypto.randomUUID(),
      created_at: new Date().toISOString(),
      user_id:    'local',
    };
    lsSave([row, ...lsLoad()]);
    return row;
  }

  /* ── Express/MongoDB mode ── */
  try {
    const data = await apiFetch<ExpenseRow>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    DB_READY = true;
    return data;
  } catch (error: any) {
    if (error.message === 'Not authenticated') {
      // Session expired/unauthenticated - fallback to local storage
      const row: ExpenseRow = {
        ...payload,
        id:         crypto.randomUUID(),
        created_at: new Date().toISOString(),
        user_id:    'local',
      };
      lsSave([row, ...lsLoad()]);
      return row;
    }
    raise('addExpense', error);
  }
}

/* ════════════════════════════════════════════════════════════════
   2. getExpenses
   ════════════════════════════════════════════════════════════════ */
export async function getExpenses(opts?: {
  category?: Category;
  from?:     string;
  to?:       string;
  limit?:    number;
}): Promise<ExpenseRow[]> {
  const { data: { user } } = await auth.getUser();

  /* ── LocalStorage mode ── */
  if (!user) {
    let rows = lsLoad();
    if (opts?.category) rows = rows.filter((r) => r.category === opts.category);
    if (opts?.from)     rows = rows.filter((r) => r.date >= opts.from!);
    if (opts?.to)       rows = rows.filter((r) => r.date <= opts.to!);
    return rows.slice(0, opts?.limit ?? 500);
  }

  /* ── Express/MongoDB mode ── */
  try {
    const params = new URLSearchParams();
    if (opts?.category) params.append('category', opts.category);
    if (opts?.from)     params.append('from', opts.from);
    if (opts?.to)       params.append('to', opts.to);
    if (opts?.limit)    params.append('limit', String(opts.limit));

    const data = await apiFetch<ExpenseRow[]>(`/expenses?${params.toString()}`);
    DB_READY = true;
    return data;
  } catch (error: any) {
    if (error.message === 'Not authenticated') {
      DB_READY = false;
      let rows = lsLoad();
      if (opts?.category) rows = rows.filter((r) => r.category === opts.category);
      if (opts?.from)     rows = rows.filter((r) => r.date >= opts.from!);
      if (opts?.to)       rows = rows.filter((r) => r.date <= opts.to!);
      return rows.slice(0, opts?.limit ?? 500);
    }
    raise('getExpenses', error);
  }
}

/* ════════════════════════════════════════════════════════════════
   3. updateExpense
   ════════════════════════════════════════════════════════════════ */
export async function updateExpense(
  id:      string,
  changes: Partial<Pick<ExpenseRow, 'title' | 'amount' | 'category' | 'date'>>
): Promise<ExpenseRow> {
  const { data: { user } } = await auth.getUser();

  /* ── LocalStorage mode ── */
  if (!user) {
    const rows = lsLoad().map((r) => (r.id === id ? { ...r, ...changes } : r));
    lsSave(rows);
    const updated = rows.find((r) => r.id === id);
    if (!updated) throw new Error(`[expenseApi] updateExpense: id ${id} not found`);
    return updated;
  }

  /* ── Express/MongoDB mode ── */
  try {
    const data = await apiFetch<ExpenseRow>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
    return data;
  } catch (error: any) {
    raise('updateExpense', error);
  }
}

/* ════════════════════════════════════════════════════════════════
   4. deleteExpense
   ════════════════════════════════════════════════════════════════ */
export async function deleteExpense(id: string): Promise<void> {
  const { data: { user } } = await auth.getUser();

  /* ── LocalStorage mode ── */
  if (!user) {
    lsSave(lsLoad().filter((r) => r.id !== id));
    return;
  }

  /* ── Express/MongoDB mode ── */
  try {
    await apiFetch<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    raise('deleteExpense', error);
  }
}

/* ════════════════════════════════════════════════════════════════
   5. getCategoryTotals — local aggregation or backend aggregation
   ════════════════════════════════════════════════════════════════ */
export async function getCategoryTotals(opts?: {
  from?: string;
  to?:   string;
}): Promise<CategoryTotal[]> {
  const { data: { user } } = await auth.getUser();

  /* ── LocalStorage mode ── */
  if (!user) {
    let rows = lsLoad();
    if (opts?.from) rows = rows.filter((r) => r.date >= opts.from!);
    if (opts?.to)   rows = rows.filter((r) => r.date <= opts.to!);

    const map: Record<string, number> = {};
    rows.forEach((r) => { map[r.category] = (map[r.category] ?? 0) + Number(r.amount); });
    return Object.entries(map)
      .map(([category, total]) => ({ category: category as Category, total }))
      .sort((a, b) => b.total - a.total);
  }

  /* ── Express/MongoDB mode ── */
  try {
    const params = new URLSearchParams();
    if (opts?.from) params.append('from', opts.from);
    if (opts?.to)   params.append('to', opts.to);

    const data = await apiFetch<CategoryTotal[]>(`/expenses/category-totals?${params.toString()}`);
    return data;
  } catch (error: any) {
    raise('getCategoryTotals', error);
  }
}

/* ════════════════════════════════════════════════════════════════
   6. getMonthlySummary — local aggregation or backend aggregation
   ════════════════════════════════════════════════════════════════ */
export async function getMonthlySummary(): Promise<MonthlySummary> {
  const { data: { user } } = await auth.getUser();

  /* ── LocalStorage mode ── */
  if (!user) {
    const ym   = new Date().toISOString().slice(0, 7);          // "YYYY-MM"
    const rows = lsLoad().filter((r) => r.date.startsWith(ym));
    const total_spent = rows.reduce((s, r) => s + Number(r.amount), 0);
    const tx_count    = rows.length;
    const day         = new Date().getDate();
    return { total_spent, tx_count, avg_per_day: day > 0 ? total_spent / day : 0 };
  }

  /* ── Express/MongoDB mode ── */
  try {
    const data = await apiFetch<MonthlySummary>('/expenses/monthly-summary');
    return data;
  } catch (error: any) {
    raise('getMonthlySummary', error);
  }
}
