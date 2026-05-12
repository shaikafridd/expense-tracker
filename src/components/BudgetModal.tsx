import React, { useState } from 'react';
import { Settings, X, Target } from 'lucide-react';
import { fmt } from '../utils';

interface Props {
  currentBudget: number;
  onSave: (budget: number) => void;
  onClose: () => void;
}

export default function BudgetModal({ currentBudget, onSave, onClose }: Props) {
  const [value, setValue] = useState(currentBudget > 0 ? String(currentBudget) : '');
  const [error, setError]  = useState('');

  const parsedNum = parseFloat(value);
  const isValid = !isNaN(parsedNum) && parsedNum > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError('Please enter a budget greater than ₹0.');
      return;
    }
    onSave(parsedNum);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '380px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ background: 'rgba(45,106,79,0.15)', borderRadius: '10px', padding: '0.5rem', display: 'flex' }}>
              <Target size={20} color="#065F46" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Monthly Budget
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Set your spending limit</p>
            </div>
          </div>
          <button
            id="close-budget-modal-btn"
            onClick={onClose}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.375rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem', display: 'block' }}>
              Budget Amount (₹)
            </label>
            <input
              id="budget-amount-input"
              className="input-field"
              type="number"
              placeholder="e.g. 50000"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(''); }}
              min="0"
              step="any"
              autoFocus
              style={{ fontSize: '1.125rem', fontWeight: 600, padding: '0.75rem 1rem' }}
            />
            {/* Live formatted preview */}
            {isValid && (
              <p style={{
                fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600,
                marginTop: '0.375rem', fontFamily: "'Inter', sans-serif",
                fontFeatureSettings: "'tnum' 1",
              }}>
                {fmt(parsedNum)} / month
              </p>
            )}
          </div>

          {error && (
            <p style={{ fontSize: '0.8125rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
              ⚠️ {error}
            </p>
          )}

          {/* Current budget display */}
          {currentBudget > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.15)',
              borderRadius: '10px', padding: '0.625rem 0.875rem',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current budget</span>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: '0.875rem',
                fontWeight: 700, color: 'var(--accent)',
                fontFeatureSettings: "'tnum' 1",
              }}>
                {fmt(currentBudget)}
              </span>
            </div>
          )}

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            💡 We'll show you a progress bar and alert when you're approaching your limit.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.625rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
              Cancel
            </button>
            <button id="save-budget-btn" type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
              <Settings size={15} /> Save Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
