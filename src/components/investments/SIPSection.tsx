import React, { useState } from 'react';
import { Target, Bike, Home, Plane, Umbrella, PiggyBank } from 'lucide-react';
import { fmt } from '../../utils';

type Risk = 'low' | 'medium' | 'high';
const RATES: Record<Risk, number> = { low: 8, medium: 12, high: 15 };
const GOALS = [
  { key: 'emergency', label: 'Emergency Fund', icon: <Umbrella size={20} />, amount: 100000, years: 2 },
  { key: 'bike', label: 'Bike Purchase', icon: <Bike size={20} />, amount: 150000, years: 3 },
  { key: 'house', label: 'House', icon: <Home size={20} />, amount: 3000000, years: 15 },
  { key: 'travel', label: 'Travel', icon: <Plane size={20} />, amount: 200000, years: 2 },
  { key: 'retire', label: 'Retirement', icon: <PiggyBank size={20} />, amount: 10000000, years: 25 },
];

function sipMonthly(target: number, years: number, annualRate: number): number {
  const r = annualRate / 12 / 100, n = years * 12;
  if (r === 0) return target / n;
  return Math.round((target * r) / (Math.pow(1 + r, n) - 1));
}

function sipFuture(monthly: number, years: number, annualRate: number): number {
  const r = annualRate / 12 / 100, n = years * 12;
  return Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

export default function SIPSection() {
  const [risk, setRisk] = useState<Risk>('medium');
  const rate = RATES[risk];
  const colors: Record<Risk, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(6,182,212,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target size={16} color="#06b6d4" />
        </div>
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '.95rem' }}>SIP Recommendations</span>
      </div>

      {/* Risk selector */}
      <div style={{ display: 'flex', gap: '.5rem' }}>
        {(['low', 'medium', 'high'] as Risk[]).map(r => (
          <button key={r} className={`chip ${risk === r ? 'active' : ''}`}
            onClick={() => setRisk(r)}
            style={risk === r ? { background: `${colors[r]}18`, borderColor: `${colors[r]}55`, color: colors[r] } : {}}>
            {r === 'low' ? '🛡️' : r === 'medium' ? '⚖️' : '🔥'} {r.charAt(0).toUpperCase() + r.slice(1)} Risk
          </button>
        ))}
      </div>

      <p style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
        Expected return: <strong style={{ color: colors[risk] }}>{rate}% p.a.</strong>
      </p>

      {/* Goal cards */}
      <div className="inv-grid-5">
        {GOALS.map(g => {
          const monthly = sipMonthly(g.amount, g.years, rate);
          const total = sipFuture(monthly, g.years, rate);
          const targetDate = new Date(); targetDate.setFullYear(targetDate.getFullYear() + g.years);
          return (
            <div key={g.key} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(45,106,79,.12)', border: '1px solid rgba(45,106,79,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065F46' }}>
                  {g.icon}
                </div>
                <div>
                  <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{g.label}</div>
                  <span className={`risk-${risk}`}>{risk.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Target</span>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>{fmt(g.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Monthly SIP</span>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#06b6d4', fontFamily: "'Inter',sans-serif" }}>{fmt(monthly)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Returns</span>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#10b981', fontFamily: "'Inter',sans-serif" }}>{fmt(total - monthly * g.years * 12)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Target Date</span>
                  <span style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text2)' }}>{targetDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
