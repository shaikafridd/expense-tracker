import React from 'react';
import { AlertTriangle, X, CheckCircle, XCircle } from 'lucide-react';
import { Expense, CATEGORY_CONFIG } from '../types';
import { fmt } from '../utils';

interface Props {
  /** The expense that is about to be added */
  pending:      Omit<Expense, 'id'>;
  totalSoFar:   number;
  monthlyBudget: number;
  onConfirm:   () => void;
  onCancel:    () => void;
}

export default function OverLimitModal({
  pending, totalSoFar, monthlyBudget, onConfirm, onCancel,
}: Props) {
  const newTotal   = totalSoFar + pending.amount;
  const overBy     = newTotal - monthlyBudget;
  const pctUsed    = Math.min((newTotal / monthlyBudget) * 100, 999);
  const cfg        = CATEGORY_CONFIG[pending.category];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal-box" style={{ maxWidth: '420px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: 'rgba(245,158,11,.15)',
              border: '1px solid rgba(245,158,11,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={22} color="#f59e0b" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Budget Limit Reached
              </h2>
              <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.1rem' }}>
                This expense exceeds your monthly cap
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '.375rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Pending expense preview ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.75rem',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '.75rem 1rem', marginBottom: '1.25rem',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
            background: cfg.bg, border: `1px solid ${cfg.hex}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
          }}>{cfg.emoji}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pending.title}</p>
            <span style={{
              fontSize: '.65rem', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
              color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.hex}33`,
              borderRadius: '20px', padding: '.1rem .45rem',
            }}>{pending.category}</span>
          </div>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>
            +{fmt(pending.amount)}
          </span>
        </div>

        {/* ── Numbers breakdown ── */}
        <div style={{
          background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)',
          borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '.625rem',
        }}>
          {[
            { label: 'Spent this month',   val: fmt(totalSoFar),    color: 'var(--text-primary)' },
            { label: 'This new expense',    val: `+${fmt(pending.amount)}`, color: '#f59e0b' },
            { label: 'New total',           val: fmt(newTotal),      color: '#ef4444' },
            { label: 'Monthly budget',      val: fmt(monthlyBudget), color: 'var(--text-secondary)' },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '.9rem', fontWeight: 700, color: row.color }}>{row.val}</span>
            </div>
          ))}
          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(239,68,68,.2)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.8rem', fontWeight: 600, color: '#ef4444' }}>Over budget by</span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>{fmt(overBy)}</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(239,68,68,.15)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '3px',
              width: `${Math.min(pctUsed, 100)}%`,
              background: 'linear-gradient(90deg,#ef4444,#dc2626)',
              transition: 'width .5s ease',
            }} />
          </div>
          <p style={{ fontSize: '.7rem', color: 'rgba(239,68,68,.6)', textAlign: 'right' }}>
            {pctUsed.toFixed(0)}% of monthly budget
          </p>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button
            id="overlimit-cancel-btn"
            onClick={onCancel}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
              padding: '.7rem', borderRadius: '10px',
              border: '1px solid var(--border-light)', background: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: "'Inter',sans-serif", fontSize: '.875rem', fontWeight: 600,
              transition: 'all .18s',
            }}
          >
            <XCircle size={15} /> Cancel
          </button>
          <button
            id="overlimit-confirm-btn"
            onClick={onConfirm}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
              padding: '.7rem', borderRadius: '10px',
              border: '1px solid rgba(239,68,68,.4)',
              background: 'rgba(239,68,68,.12)',
              color: '#ef4444', cursor: 'pointer',
              fontFamily: "'Inter',sans-serif", fontSize: '.875rem', fontWeight: 700,
              transition: 'all .18s',
            }}
          >
            <CheckCircle size={15} /> Add Anyway
          </button>
        </div>

      </div>
    </div>
  );
}
