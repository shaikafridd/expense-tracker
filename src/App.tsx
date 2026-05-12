import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Plus, Target, Wallet, TrendingUp, Zap,
  AlertTriangle, Calendar, BarChart2,
  ListFilter, Settings, ChevronDown,
  Loader2, WifiOff, RefreshCw, LogOut, LineChart,
} from 'lucide-react';
import { Expense, Category, CATEGORIES, CATEGORY_CONFIG } from './types';
import {
  getExpenses, addExpense as apiAdd, deleteExpense as apiDelete,
  type ExpenseRow, DB_READY,
} from './lib/expenseApi';
import { IS_CONFIGURED, supabase } from './lib/supabaseClient';
import { loadBudget, saveBudget, fmt, isThisMonth, todayISO } from './utils';
import SpendingChart from './components/CategoryChart';
import ExpenseFeed from './components/ExpenseList';
import AddExpenseModal from './components/AddExpenseModal';
import BudgetModal from './components/BudgetModal';
import OverLimitModal from './components/OverLimitModal';
import AnalyticsCard from './components/AnalyticsCard';
import InvestmentsPage from './components/InvestmentsPage';

/* ── Types ──────────────────────────────────────────────────── */
type CatFilter = 'All' | Category;
type DateRange = { from: string; to: string };
type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type Page = 'expenses' | 'investments';

/** Map a Supabase ExpenseRow → local Expense shape */
function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    date: row.date,
  };
}

/* ── Helpers ─────────────────────────────────────────────────── */
function inRange(iso: string, range: DateRange): boolean {
  if (!range.from && !range.to) return true;
  if (range.from && iso < range.from) return false;
  if (range.to && iso > range.to) return false;
  return true;
}

/* ══════════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════════ */
export default function App({ user }: { user: User | null }) {
  /* ── Data state ── */
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);   // initial fetch
  const [syncing, setSyncing] = useState(false);  // add / delete in flight
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [schemaReady, setSchemaReady] = useState(true); // flips false if table missing

  /* ── UI state ── */
  const [budget, setBudget] = useState(() => loadBudget());
  const [showAdd, setShowAdd] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [catFilter, setCatFilter] = useState<CatFilter>('All');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [page, setPage] = useState<Page>('expenses');

  /** Expense waiting for over-limit confirmation; null = no pending check */
  const [pendingExpense, setPendingExpense] = useState<Omit<Expense, 'id'> | null>(null);

  /* Persist budget locally (no user_id needed — it's a device preference) */
  useEffect(() => { saveBudget(budget); }, [budget]);

  /* ── Abort controller for fetch cancellation ── */
  const abortRef = useRef<AbortController | null>(null);
  /* Stable ref so deleteExpense never captures stale expenses */
  const expensesRef = useRef<Expense[]>(expenses);
  useEffect(() => { expensesRef.current = expenses; }, [expenses]);

  /* ── fetchAll: load from Supabase ── */
  const fetchAll = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setFetchError(null);
    try {
      const rows = await getExpenses();                 // RLS filters by uid automatically
      setExpenses(rows.map(toExpense));
      setSchemaReady(DB_READY || !IS_CONFIGURED);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load expenses.';
      // Ignore AbortError — it just means a newer fetch superseded this one
      if (!msg.includes('abort')) setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  /* Fetch on mount */
  useEffect(() => {
    void fetchAll();
    return () => abortRef.current?.abort();
  }, [fetchAll]);

  /* ── commitAddExpense: the actual write (called after any limit check) ── */
  const commitAddExpense = useCallback(async (payload: Omit<Expense, 'id'>) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Expense = { ...payload, id: tempId };
    setExpenses((prev) => [optimistic, ...prev]);
    setSyncing(true);
    try {
      const row = await apiAdd({
        title: payload.title,
        amount: payload.amount,
        category: payload.category,
        date: payload.date,
      });
      setExpenses((prev) =>
        prev.map((e) => (e.id === tempId ? toExpense(row) : e))
      );
    } catch (err: unknown) {
      setExpenses((prev) => prev.filter((e) => e.id !== tempId));
      const msg = err instanceof Error ? err.message : 'Could not save expense.';
      alert(`⚠️ ${msg}`);
    } finally {
      setSyncing(false);
    }
  }, []);

  /**
   * requestAddExpense — called by AddExpenseModal.
   * If adding this expense would exceed the monthly budget, it stores
   * the payload in `pendingExpense` and shows the OverLimitModal instead
   * of writing immediately. The user can then confirm or cancel.
   */
  const requestAddExpense = useCallback((payload: Omit<Expense, 'id'>) => {
    const currentMonthTotal = expensesRef.current
      .filter((e) => isThisMonth(e.date))
      .reduce((s, e) => s + e.amount, 0);
    const budgetLimit = loadBudget().monthly;

    if (budgetLimit > 0 && currentMonthTotal + payload.amount > budgetLimit) {
      // Park it — wait for user to confirm or cancel in OverLimitModal
      setPendingExpense(payload);
    } else {
      void commitAddExpense(payload);
    }
  }, [commitAddExpense]);

  /* ── deleteExpense: optimistic remove + Supabase delete ── */
  const deleteExpense = useCallback(async (id: string) => {
    // 1. Snapshot for rollback (use ref to avoid stale closure)
    const snapshot = expensesRef.current.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setSyncing(true);

    try {
      await apiDelete(id);
    } catch (err: unknown) {
      // 2. Restore on failure
      if (snapshot) setExpenses((prev) => [snapshot, ...prev]);
      const msg = err instanceof Error ? err.message : 'Could not delete expense.';
      alert(`⚠️ ${msg}`);
    } finally {
      setSyncing(false);
    }
  }, []);  // no deps — stable for the lifetime of the component

  /* ── Derived stats ── */
  const monthExpenses = expenses.filter((e) => isThisMonth(e.date));
  const totalThisMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const txCount = monthExpenses.length;
  const budgetPct = budget.monthly > 0 ? Math.min((totalThisMonth / budget.monthly) * 100, 100) : 0;
  const isOver = budget.monthly > 0 && totalThisMonth > budget.monthly;
  const isNear = budget.monthly > 0 && budgetPct >= 80 && !isOver;

  const avgToday = (() => {
    const day = new Date().getDate();
    return day > 0 ? totalThisMonth / day : 0;
  })();

  /* ── Filtered + sorted list ── */
  const visibleExpenses = useMemo(() => {
    let list = expenses;
    if (catFilter !== 'All') list = list.filter((e) => e.category === catFilter);
    list = list.filter((e) => inRange(e.date, dateRange));
    switch (sortKey) {
      case 'date-desc': return [...list].sort((a, b) => b.date.localeCompare(a.date));
      case 'date-asc': return [...list].sort((a, b) => a.date.localeCompare(b.date));
      case 'amount-desc': return [...list].sort((a, b) => b.amount - a.amount);
      case 'amount-asc': return [...list].sort((a, b) => a.amount - b.amount);
    }
  }, [expenses, catFilter, dateRange, sortKey]);

  /* Chart uses current-month data, filtered by active category tab */
  const chartExpenses = catFilter === 'All'
    ? monthExpenses
    : monthExpenses.filter((e) => e.category === catFilter);

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="bg-mesh" style={{ minHeight: '100svh' }}>

      {/* ── Sticky Header ──────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          padding: '0 1rem', height: '58px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
            <div className="logo-icon" style={{
              width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg,#065F46,#6EE7B7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="#fff" />
            </div>
            <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 400, fontSize: '1.1rem', color: 'var(--text1)' }}>
              Sage <span style={{ color: 'var(--accent)', fontWeight: 400 }}>Wealth</span>
            </span>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>

            {/* Sync indicator */}
            {syncing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--text3)', fontSize: '.72rem' }}>
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                Saving…
              </div>
            )}

            <button
              id="header-budget-btn"
              onClick={() => setShowBudget(true)}
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px',
                padding: '.4rem .75rem', cursor: 'pointer', color: 'var(--text2)',
                fontFamily: "'Inter',sans-serif", fontSize: '.8rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '.375rem', transition: 'all .18s',
              }}
            >
              <Target size={14} /> Budget
            </button>

            <button
              id="header-add-btn"
              className="btn-primary desktop-add-btn"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={16} /> Add Expense
            </button>

            {/* User avatar + sign-out (only when Supabase is live) */}
            {IS_CONFIGURED && user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
                {/* Avatar circle */}
                <div title={user.email} style={{
                  width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#065F46,#6EE7B7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.7rem', fontWeight: 700, color: '#fff',
                  border: '2px solid rgba(45,106,79,.3)',
                }}>
                  {(user.user_metadata?.full_name as string | undefined)?.[0]?.toUpperCase()
                    ?? user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <button
                  id="sign-out-btn"
                  title="Sign out"
                  onClick={() => supabase.auth.signOut()}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border2)',
                    borderRadius: '8px', padding: '.35rem .5rem',
                    cursor: 'pointer', color: 'var(--text3)',
                    display: 'flex', alignItems: 'center',
                    transition: 'all .18s',
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Page Nav Tabs ────────────────────────────────────────── */}
      <nav className="page-nav" style={{ position: 'sticky', top: 58, zIndex: 39, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', gap: '.25rem' }}>
          <button id="nav-expenses" className={`page-nav-tab ${page === 'expenses' ? 'active' : ''}`} onClick={() => setPage('expenses')}>
            <BarChart2 size={14} /> Expenses
          </button>
          <button id="nav-investments" className={`page-nav-tab ${page === 'investments' ? 'active' : ''}`} onClick={() => setPage('investments')}>
            <LineChart size={14} /> Investments
          </button>
        </div>
      </nav>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem', paddingBottom: '5rem' }}>

      {page === 'investments' ? (
        <InvestmentsPage budget={budget.monthly} spent={totalThisMonth} />
      ) : (
      <>

        {/* ── Demo mode notice (no Supabase keys) ── */}
        {!IS_CONFIGURED && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '.625rem',
            marginBottom: '1rem',
            background: 'rgba(139,92,246,.08)',
            border: '1px solid rgba(139,92,246,.25)',
            borderRadius: '10px', padding: '.625rem 1rem',
          }}>
            <span style={{ fontSize: '1rem' }}>🛠️</span>
            <span style={{ fontSize: '.8rem', color: '#a78bfa', lineHeight: 1.5 }}>
              <strong>Demo mode</strong> — running on LocalStorage.&nbsp;
              Open <code style={{ fontSize: '.75rem', background: 'rgba(139,92,246,.15)', padding: '.1rem .35rem', borderRadius: '4px' }}>src/lib/supabaseClient.ts</code>
              &nbsp;and replace the two placeholder strings with your real Supabase URL &amp; Anon Key to enable the cloud backend.
            </span>
          </div>
        )}

        {/* ── Schema not set up notice (keys added but SQL not run) ── */}
        {IS_CONFIGURED && !schemaReady && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '.625rem',
            marginBottom: '1rem',
            background: 'rgba(245,158,11,.07)',
            border: '1px solid rgba(245,158,11,.3)',
            borderRadius: '10px', padding: '.75rem 1rem',
          }}>
            <span style={{ fontSize: '1.1rem', marginTop: '.05rem' }}>⚠️</span>
            <div style={{ fontSize: '.8rem', color: '#fbbf24', lineHeight: 1.6 }}>
              <strong>Supabase table not found.</strong> The app is running on LocalStorage until you create the database schema.<br />
              <span style={{ color: 'rgba(251,191,36,.7)' }}>
                1. Open the&nbsp;
                <a
                  href="https://supabase.com/dashboard/project/hfmxbdwjgsrbispnokbl/sql/new"
                  target="_blank" rel="noreferrer"
                  style={{ color: '#fbbf24', fontWeight: 600 }}
                >
                  Supabase SQL Editor ↗
                </a>
                &nbsp;2. Paste &amp; run the contents of&nbsp;
                <code style={{ fontSize: '.75rem', background: 'rgba(245,158,11,.15)', padding: '.1rem .35rem', borderRadius: '4px' }}>supabase/schema.sql</code>
                &nbsp;3. Refresh this page.
              </span>
            </div>
          </div>
        )}

        {/* ── Error banner ── */}
        {fetchError && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '.75rem', marginBottom: '1rem',
            background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)',
            borderRadius: '10px', padding: '.625rem 1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <WifiOff size={15} color="#ef4444" />
              <span style={{ fontSize: '.8125rem', color: '#ef4444', fontWeight: 500 }}>
                {fetchError}
              </span>
            </div>
            <button
              id="retry-fetch-btn"
              onClick={() => void fetchAll()}
              style={{
                display: 'flex', alignItems: 'center', gap: '.3rem',
                background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
                borderRadius: '6px', padding: '.3rem .625rem',
                color: '#ef4444', fontSize: '.75rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter',sans-serif",
              }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Budget warning */}
        {(isOver || isNear) && (
          <div className="warn-banner" style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '1rem' }}>
            <AlertTriangle size={16} color={isOver ? '#ef4444' : '#f59e0b'} />
            <span style={{ fontSize: '.8125rem', color: isOver ? '#ef4444' : '#f59e0b', fontWeight: 500 }}>
              {isOver
                ? `Budget exceeded! You're ${fmt(totalThisMonth - budget.monthly)} over your limit.`
                : `You've used ${budgetPct.toFixed(0)}% of your monthly budget — slow down! 🔥`}
            </span>
          </div>
        )}

        <div className="app-grid">

          {/* ══ LEFT / TOP PANEL ══════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Balance card */}
            <div className="balance-card">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p className="section-label" style={{ color: 'rgba(255,255,255,.65)', marginBottom: '.375rem' }}>
                  Total Spent This Month
                </p>
                <div className="stat-num" style={{ fontSize: '2.25rem', marginBottom: '.5rem', color: '#fff' }}>
                  {loading
                    ? <span style={{ fontSize: '1.25rem', color: 'var(--text3)' }}>Loading…</span>
                    : fmt(totalThisMonth)
                  }
                </div>

                {/* Budget progress */}
                {budget.monthly > 0 && (
                  <div style={{ marginBottom: '.875rem' }}>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${budgetPct}%`,
                          background: isOver ? 'linear-gradient(90deg,#E17055,#d63031)'
                            : isNear ? 'linear-gradient(90deg,#F0A500,#E17055)'
                              : 'linear-gradient(90deg,#6EE7B7,#D1FAE5)',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.55)', marginTop: '.25rem' }}>
                      {fmt(totalThisMonth)} of {fmt(budget.monthly)} budget used
                    </p>
                  </div>
                )}

                {/* Mini stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.5rem' }}>
                  {[
                    { icon: <Wallet size={13} />, label: 'Transactions', val: loading ? '—' : txCount },
                    { icon: <TrendingUp size={13} />, label: 'Daily Avg', val: loading ? '—' : fmt(avgToday) },
                    { icon: <BarChart2 size={13} />, label: 'All Time', val: loading ? '—' : fmt(totalAll) },
                  ].map((s) => (
                    <div key={s.label} style={{
                      background: 'rgba(255,255,255,.1)', borderRadius: '10px', padding: '.5rem .625rem',
                      border: 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', color: 'rgba(255,255,255,.6)', marginBottom: '.2rem' }}>
                        {s.icon}
                        <span style={{ fontSize: '.62rem', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>{s.label}</span>
                      </div>
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '.9rem', fontWeight: 500, color: '#fff' }}>
                        {s.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pie Chart card */}
            <div className="card-padded">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                <BarChart2 size={15} color="#8b5cf6" />
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '.9375rem' }}>
                  Spending Breakdown
                </span>
              </div>
              {loading
                ? <LoadingPulse rows={3} />
                : <SpendingChart expenses={chartExpenses} totalSpent={totalThisMonth} />
              }
            </div>

            {/* Analytics card */}
            {!loading && (
              <AnalyticsCard
                expenses={expenses}
                monthExpenses={monthExpenses}
                budget={budget.monthly}
              />
            )}

          </div>

          {/* ══ RIGHT / BOTTOM PANEL ══════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Category filter tabs */}
            <div className="filter-tabs">
              {(['All', ...CATEGORIES] as CatFilter[]).map((c) => {
                const active = catFilter === c;
                const cfg = c !== 'All' ? CATEGORY_CONFIG[c] : null;
                return (
                  <button
                    key={c}
                    id={`filter-tab-${c.toLowerCase()}`}
                    className={`filter-tab ${active ? 'active' : ''}`}
                    onClick={() => setCatFilter(c)}
                    style={active && cfg
                      ? { color: cfg.color, boxShadow: `inset 0 0 0 1px ${cfg.hex}55, 0 0 10px ${cfg.hex}22` }
                      : {}}
                  >
                    {cfg && <span>{cfg.emoji}</span>}
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Controls: date filter + sort */}
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem', flexWrap: 'wrap' }}>

                {/* Date toggle */}
                <button
                  id="toggle-date-filter"
                  onClick={() => setShowDateFilter((p) => !p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '.375rem',
                    background: showDateFilter ? 'rgba(139,92,246,.15)' : 'transparent',
                    border: `1px solid ${showDateFilter ? 'rgba(139,92,246,.4)' : 'var(--border2)'}`,
                    borderRadius: '8px', padding: '.375rem .75rem',
                    color: showDateFilter ? '#8b5cf6' : 'var(--text2)',
                    cursor: 'pointer', fontSize: '.8rem', fontWeight: 500, fontFamily: "'Inter',sans-serif",
                    transition: 'all .18s',
                  }}
                >
                  <Calendar size={13} /> Date Filter
                  {(dateRange.from || dateRange.to) && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />
                  )}
                </button>

                {/* Clear date */}
                {(dateRange.from || dateRange.to) && (
                  <button
                    id="clear-date-filter"
                    onClick={() => setDateRange({ from: '', to: '' })}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '.75rem', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 500 }}
                  >
                    Clear dates ✕
                  </button>
                )}

                {/* Sort */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', marginLeft: 'auto' }}>
                  <ListFilter size={13} color="var(--text3)" />
                  <div style={{ position: 'relative' }}>
                    <select
                      id="sort-select"
                      className="input-field"
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      style={{ padding: '.35rem 1.75rem .35rem .625rem', fontSize: '.78rem', appearance: 'none', minWidth: '130px' }}
                    >
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="amount-desc">Highest Amount</option>
                      <option value="amount-asc">Lowest Amount</option>
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: '.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Date inputs */}
              {showDateFilter && (
                <div className="date-row" style={{ marginTop: '.75rem' }}>
                  <div>
                    <label className="form-label">From</label>
                    <input
                      id="date-from"
                      className="input-field"
                      type="date"
                      value={dateRange.from}
                      max={dateRange.to || todayISO()}
                      onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">To</label>
                    <input
                      id="date-to"
                      className="input-field"
                      type="date"
                      value={dateRange.to}
                      min={dateRange.from}
                      max={todayISO()}
                      onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Expense feed */}
            <div className="card">
              <div style={{
                padding: '.875rem 1rem', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
                  <Settings size={14} color="var(--text3)" />
                  <span className="section-label">Expense Feed</span>
                </div>
                <span style={{ fontSize: '.72rem', color: 'var(--text3)', fontWeight: 600 }}>
                  {loading ? '…' : `${visibleExpenses.length} result${visibleExpenses.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div style={{ padding: '.875rem', maxHeight: '420px', overflowY: 'auto' }}>
                {loading
                  ? <LoadingPulse rows={5} />
                  : <ExpenseFeed expenses={visibleExpenses} onDelete={(id) => void deleteExpense(id)} />
                }
              </div>
            </div>

          </div>
        </div>
      </>
      )}
      </main>

      {/* ── FAB (mobile only) ───────────────────────────────────── */}
      <button
        id="fab-add-btn"
        className="fab"
        onClick={() => setShowAdd(true)}
        aria-label="Add expense"
      >
        <Plus size={26} />
      </button>

      {/* ── Modals ──────────────────────────────────────────────── */}
      {showAdd && (
        <AddExpenseModal
          onAdd={(e) => { requestAddExpense(e); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
      {showBudget && (
        <BudgetModal
          currentBudget={budget.monthly}
          onSave={(m) => setBudget({ monthly: m })}
          onClose={() => setShowBudget(false)}
        />
      )}
      {pendingExpense && (
        <OverLimitModal
          pending={pendingExpense}
          totalSoFar={monthExpenses.reduce((s, e) => s + e.amount, 0)}
          monthlyBudget={budget.monthly}
          onConfirm={() => { void commitAddExpense(pendingExpense); setPendingExpense(null); }}
          onCancel={() => setPendingExpense(null)}
        />
      )}
    </div>
  );
}

/* ── Skeleton loader ────────────────────────────────────────── */
function LoadingPulse({ rows }: { rows: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '52px', borderRadius: '12px',
            background: 'linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%)',
            backgroundSize: '200% 100%',
            animation: `shimmer 1.4s ease-in-out ${i * 0.08}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
