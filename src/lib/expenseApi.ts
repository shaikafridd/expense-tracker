/**
 * expenseApi.ts
 * ─────────────────────────────────────────────────────────────────
 *  Smart data layer: routes to Supabase when credentials are
 *  configured, otherwise falls back to LocalStorage (demo mode).
 *  The caller never needs to know which backend is active.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase, IS_CONFIGURED } from './supabaseClient';
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
export let DB_READY = false;

/** Errors that mean "schema not set up yet" — not real runtime errors */
function isSetupError(msg: string): boolean {
  return (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    msg.includes('permission denied') ||
    msg.includes('JWT') ||
    msg.includes('not authenticated') ||
    msg.includes('row-level security')
  );
}

function raise(ctx: string, err: { message: string }): never {
  throw new Error(`[expenseApi] ${ctx}: ${err.message}`);
}

/* ════════════════════════════════════════════════════════════════
   1. addExpense
════════════════════════════════════════════════════════════════ */
export async function addExpense(
  payload: Pick<ExpenseRow, 'title' | 'amount' | 'category' | 'date'>
): Promise<ExpenseRow> {
  /* ── LocalStorage mode ── */
  if (!IS_CONFIGURED) {
    const row: ExpenseRow = {
      ...payload,
      id:         crypto.randomUUID(),
      created_at: new Date().toISOString(),
      user_id:    'local',
    };
    lsSave([row, ...lsLoad()]);
    return row;
  }

  /* ── Supabase mode ── */
  const { data: { user } } = await supabase.auth.getUser();
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

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single();

  if (error) {
    if (isSetupError(error.message)) {
      // DB not ready — fall back silently to LocalStorage
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
  DB_READY = true;
  return data as ExpenseRow;
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
  /* ── LocalStorage mode ── */
  if (!IS_CONFIGURED) {
    let rows = lsLoad();
    if (opts?.category) rows = rows.filter((r) => r.category === opts.category);
    if (opts?.from)     rows = rows.filter((r) => r.date >= opts.from!);
    if (opts?.to)       rows = rows.filter((r) => r.date <= opts.to!);
    return rows.slice(0, opts?.limit ?? 500);
  }

  /* ── Supabase mode ── */
  let query = supabase
    .from('expenses')
    .select('*')
    .order('date',       { ascending: false })
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 500);

  if (opts?.category) query = query.eq('category', opts.category);
  if (opts?.from)     query = query.gte('date', opts.from);
  if (opts?.to)       query = query.lte('date', opts.to);

  const { data, error } = await query;
  if (error) {
    if (isSetupError(error.message)) {
      // Schema not applied yet — silently serve from LocalStorage
      DB_READY = false;
      let rows = lsLoad();
      if (opts?.category) rows = rows.filter((r) => r.category === opts.category);
      if (opts?.from)     rows = rows.filter((r) => r.date >= opts.from!);
      if (opts?.to)       rows = rows.filter((r) => r.date <= opts.to!);
      return rows.slice(0, opts?.limit ?? 500);
    }
    raise('getExpenses', error);
  }
  DB_READY = true;
  return (data ?? []) as ExpenseRow[];
}

/* ════════════════════════════════════════════════════════════════
   3. updateExpense
════════════════════════════════════════════════════════════════ */
export async function updateExpense(
  id:      string,
  changes: Partial<Pick<ExpenseRow, 'title' | 'amount' | 'category' | 'date'>>
): Promise<ExpenseRow> {
  /* ── LocalStorage mode ── */
  if (!IS_CONFIGURED) {
    const rows = lsLoad().map((r) => (r.id === id ? { ...r, ...changes } : r));
    lsSave(rows);
    const updated = rows.find((r) => r.id === id);
    if (!updated) throw new Error(`[expenseApi] updateExpense: id ${id} not found`);
    return updated;
  }

  /* ── Supabase mode ── */
  const { data, error } = await supabase
    .from('expenses')
    .update(changes)
    .eq('id', id)
    .select()
    .single();

  if (error) raise('updateExpense', error);
  return data as ExpenseRow;
}

/* ════════════════════════════════════════════════════════════════
   4. deleteExpense
════════════════════════════════════════════════════════════════ */
export async function deleteExpense(id: string): Promise<void> {
  /* ── LocalStorage mode ── */
  if (!IS_CONFIGURED) {
    lsSave(lsLoad().filter((r) => r.id !== id));
    return;
  }

  /* ── Supabase mode ── */
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) {
    if (isSetupError(error.message)) {
      lsSave(lsLoad().filter((r) => r.id !== id));
      return;
    }
    raise('deleteExpense', error);
  }
}

/* ════════════════════════════════════════════════════════════════
   5. getCategoryTotals — RPC (Supabase) or local aggregation
════════════════════════════════════════════════════════════════ */
export async function getCategoryTotals(opts?: {
  from?: string;
  to?:   string;
}): Promise<CategoryTotal[]> {
  /* ── LocalStorage mode ── */
  if (!IS_CONFIGURED) {
    let rows = lsLoad();
    if (opts?.from) rows = rows.filter((r) => r.date >= opts.from!);
    if (opts?.to)   rows = rows.filter((r) => r.date <= opts.to!);

    const map: Record<string, number> = {};
    rows.forEach((r) => { map[r.category] = (map[r.category] ?? 0) + Number(r.amount); });
    return Object.entries(map)
      .map(([category, total]) => ({ category: category as Category, total }))
      .sort((a, b) => b.total - a.total);
  }

  /* ── Supabase mode ── */
  const params: Record<string, string> = {};
  if (opts?.from) params['p_from'] = opts.from;
  if (opts?.to)   params['p_to']   = opts.to;

  const { data, error } = await supabase.rpc('get_category_totals', params);
  if (error) raise('getCategoryTotals', error);
  return (data ?? []) as CategoryTotal[];
}

/* ════════════════════════════════════════════════════════════════
   6. getMonthlySummary — RPC (Supabase) or local aggregation
════════════════════════════════════════════════════════════════ */
export async function getMonthlySummary(): Promise<MonthlySummary> {
  /* ── LocalStorage mode ── */
  if (!IS_CONFIGURED) {
    const ym   = new Date().toISOString().slice(0, 7);          // "YYYY-MM"
    const rows = lsLoad().filter((r) => r.date.startsWith(ym));
    const total_spent = rows.reduce((s, r) => s + Number(r.amount), 0);
    const tx_count    = rows.length;
    const day         = new Date().getDate();
    return { total_spent, tx_count, avg_per_day: day > 0 ? total_spent / day : 0 };
  }

  /* ── Supabase mode ── */
  const { data, error } = await supabase.rpc('get_monthly_summary');
  if (error) raise('getMonthlySummary', error);
  return data as MonthlySummary;
}
