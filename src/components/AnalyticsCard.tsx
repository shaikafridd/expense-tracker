import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Expense, CATEGORY_CONFIG, CATEGORIES, Category } from '../types';
import { fmt } from '../utils';

interface Props {
  expenses:      Expense[];   // all expenses (full history)
  monthExpenses: Expense[];   // current-month only
  budget:        number;      // monthly budget (0 = unset)
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function AnalyticsCard({ expenses, monthExpenses, budget }: Props) {
  const now            = new Date();
  const dayOfMonth     = now.getDate();
  const totalDays      = daysInMonth(now.getFullYear(), now.getMonth());
  const daysLeft       = totalDays - dayOfMonth;
  const totalSpent     = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const dailyAvg       = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const projected      = dailyAvg * totalDays;
  const projectedOver  = budget > 0 && projected > budget;
  const safe           = budget > 0 ? Math.max(0, budget - totalSpent) : null;
  const safePerDay     = safe !== null && daysLeft > 0 ? safe / daysLeft : null;

  /* Per-category totals for this month */
  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return (Object.entries(map) as [Category, number][])
      .sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  /* Biggest single expense this month */
  const biggest = monthExpenses.reduce<Expense | null>(
    (max, e) => (!max || e.amount > max.amount ? e : max), null,
  );

  const TrendIcon = projectedOver ? TrendingUp : projected > 0 ? Minus : TrendingDown;
  const trendColor = projectedOver ? '#ef4444' : '#10b981';

  return (
    <div className="card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <Activity size={15} color="#065F46" />
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: '.9375rem' }}>
          Spending Analytics
        </span>
      </div>

      {/* ── Projection row ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.625rem',
      }}>
        {/* Projected spend */}
        <div style={{
          background: projectedOver ? 'rgba(239,68,68,.08)' : 'rgba(16,185,129,.08)',
          border: `1px solid ${projectedOver ? 'rgba(239,68,68,.25)' : 'rgba(16,185,129,.25)'}`,
          borderRadius: '12px', padding: '.875rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginBottom: '.375rem' }}>
            <TrendIcon size={13} color={trendColor} />
            <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: trendColor }}>
              Projected
            </span>
          </div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.05rem', fontWeight: 700, color: trendColor }}>
            {fmt(projected)}
          </div>
          <p style={{ fontSize: '.67rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
            by end of {now.toLocaleString('en-IN', { month: 'long' })}
          </p>
        </div>

        {/* Safe-to-spend per day */}
        <div style={{
          background: 'rgba(45,106,79,.08)',
          border: '1px solid rgba(45,106,79,.2)',
          borderRadius: '12px', padding: '.875rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginBottom: '.375rem' }}>
            <TrendingDown size={13} color="#065F46" />
            <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#065F46' }}>
              Safe / Day
            </span>
          </div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.05rem', fontWeight: 700, color: '#065F46' }}>
            {safePerDay !== null ? (safePerDay > 0 ? fmt(safePerDay) : '₹0') : '—'}
          </div>
          <p style={{ fontSize: '.67rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
          </p>
        </div>
      </div>

      {/* ── Projected over-budget warning ── */}
      {projectedOver && budget > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.5rem',
          background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)',
          borderRadius: '10px', padding: '.625rem .875rem',
        }}>
          <span style={{ fontSize: '.95rem' }}>🔥</span>
          <span style={{ fontSize: '.78rem', color: '#ef4444', fontWeight: 500, lineHeight: 1.4 }}>
            At your current pace you'll overshoot your budget by{' '}
            <strong>{fmt(projected - budget)}</strong> this month.
          </span>
        </div>
      )}

      {/* ── Category breakdown ── */}
      {catTotals.length > 0 && (
        <div>
          <p style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.625rem' }}>
            This Month by Category
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {catTotals.map(([cat, total]) => {
              const cfg  = CATEGORY_CONFIG[cat];
              const pct  = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
              const budgetPct = budget > 0 ? Math.min((total / budget) * 100, 100) : null;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <span style={{ fontSize: '.9rem' }}>{cfg.emoji}</span>
                      <span style={{ fontSize: '.8rem', fontWeight: 600, color: cfg.color }}>{cat}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
                      <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</span>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(total)}</span>
                    </div>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      width: `${pct}%`,
                      background: cfg.gradient,
                      transition: 'width .5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Biggest expense ── */}
      {biggest && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.75rem',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '.75rem',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: CATEGORY_CONFIG[biggest.category].bg,
            border: `1px solid ${CATEGORY_CONFIG[biggest.category].hex}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
          }}>
            {CATEGORY_CONFIG[biggest.category].emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '.67rem', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Biggest Expense
            </p>
            <p style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {biggest.title}
            </p>
          </div>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '.95rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
            {fmt(biggest.amount)}
          </span>
        </div>
      )}

      {/* Empty state */}
      {catTotals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-muted)', fontSize: '.825rem' }}>
          📈 Add expenses to see your analytics
        </div>
      )}
    </div>
  );
}
