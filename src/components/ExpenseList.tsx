import React from 'react';
import { Trash2 } from 'lucide-react';
import { Expense, CATEGORY_CONFIG } from '../types';
import { fmt, fmtDate } from '../utils';

interface Props {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

export default function ExpenseFeed({ expenses, onDelete }: Props) {
  if (expenses.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: '2.5rem' }}>🌌</span>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Nothing here yet</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Tap <strong style={{ color: 'var(--accent-violet)' }}>+ Add</strong> to log your first expense</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {expenses.map((exp) => {
        const cfg = CATEGORY_CONFIG[exp.category];
        return (
          <div key={exp.id} className="expense-row" id={`expense-item-${exp.id}`}>
            {/* Icon */}
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
              background: cfg.bg, border: `1px solid ${cfg.hex}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem',
            }}>
              {cfg.emoji}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {exp.title}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.hex}33`,
                  borderRadius: '20px', padding: '0.15rem 0.5rem',
                }}>
                  {exp.category}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmtDate(exp.date)}</span>
              </div>
            </div>

            {/* Amount + delete */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {fmt(exp.amount)}
              </span>
              <button
                id={`delete-btn-${exp.id}`}
                className="btn-danger"
                onClick={() => onDelete(exp.id)}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
