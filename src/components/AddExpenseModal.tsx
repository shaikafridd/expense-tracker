import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Expense, CATEGORIES, CATEGORY_CONFIG, Category } from '../types';
import { todayISO } from '../utils';

interface Props {
  onAdd: (e: Omit<Expense, 'id'>) => void;
  onClose: () => void;
}

export default function AddExpenseModal({ onAdd, onClose }: Props) {
  const [title,    setTitle]    = useState('');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date,     setDate]     = useState(todayISO());
  const [error,    setError]    = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    onAdd({ title: title.trim(), amount: amt, category, date });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            New Expense
          </h2>
          <button
            id="modal-close-btn"
            onClick={onClose}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.375rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Title */}
          <div>
            <label className="form-label">Title</label>
            <input
              id="input-title"
              className="input-field"
              type="text"
              placeholder="e.g. Dinner with friends"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Amount */}
          <div>
            <label className="form-label">Amount (₹)</label>
            <input
              id="input-amount"
              className="input-field"
              type="number"
              placeholder="0"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ fontSize: '1.125rem', fontWeight: 600 }}
            />
          </div>

          {/* Category pills */}
          <div>
            <label className="form-label">Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem', marginTop: '0.375rem' }}>
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    id={`cat-pill-${cat.toLowerCase()}`}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '0.5rem 0.25rem',
                      borderRadius: '10px',
                      border: active ? `1.5px solid ${cfg.hex}` : '1.5px solid var(--border)',
                      background: active ? cfg.bg : 'transparent',
                      color: active ? cfg.color : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontFamily: "'Inter',sans-serif",
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.18s ease',
                      boxShadow: active ? `0 0 12px ${cfg.hex}33` : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{cfg.emoji}</span>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="form-label">Date</label>
            <input
              id="input-date"
              className="input-field"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.8125rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
              ⚠️ {error}
            </p>
          )}

          <button id="submit-btn" type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '0.75rem', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            <Plus size={18} /> Add Expense
          </button>
        </form>
      </div>
    </div>
  );
}
