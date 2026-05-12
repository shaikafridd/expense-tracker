import React from 'react';
import { Activity } from 'lucide-react';

interface Props { budget: number; spent: number; }

export default function HealthScore({ budget, spent }: Props) {
  const savingsRate = budget > 0 ? Math.min(((budget - spent) / budget) * 100, 100) : 0;
  const emergencyScore = savingsRate > 20 ? 25 : (savingsRate / 20) * 25;
  const debtScore = 20; // placeholder — no debt tracking yet
  const sipScore = savingsRate > 30 ? 25 : (savingsRate / 30) * 25;
  const savScore = Math.min(savingsRate / 40 * 30, 30);
  const total = Math.round(Math.min(savScore + debtScore + emergencyScore + sipScore, 100));

  const color = total >= 70 ? '#10b981' : total >= 40 ? '#f59e0b' : '#ef4444';
  const label = total >= 70 ? 'Excellent' : total >= 40 ? 'Moderate' : 'Needs Work';

  // Gauge SVG
  const r = 68, c = Math.PI * r, filled = (total / 100) * c;

  return (
    <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: `radial-gradient(circle, ${color}18, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', alignSelf: 'flex-start' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(45,106,79,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={16} color="#065F46" />
        </div>
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '.95rem' }}>Health Score</span>
      </div>

      {/* Gauge */}
      <svg width={160} height={90} viewBox="0 0 160 90" style={{ marginBottom: '.5rem' }}>
        <path d={`M 12 84 A ${r} ${r} 0 0 1 148 84`} fill="none" stroke="rgba(45,106,79,.12)" strokeWidth={8} strokeLinecap="round" />
        <path d={`M 12 84 A ${r} ${r} 0 0 1 148 84`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - filled}
          style={{ transition: 'stroke-dashoffset 1.5s ease', filter: `drop-shadow(0 0 8px ${color}88)` }} />
        <text x="80" y="72" textAnchor="middle" style={{ fontFamily: "'Inter',sans-serif", fontSize: '2rem', fontWeight: 700, fill: color }}>{total}</text>
        <text x="80" y="88" textAnchor="middle" style={{ fontSize: '.55rem', fontWeight: 700, fill: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</text>
      </svg>

      {/* Breakdown */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        {[
          { name: 'Savings Rate', score: Math.round(savScore), max: 30, c: '#10b981' },
          { name: 'Debt Level', score: debtScore, max: 20, c: '#06b6d4' },
          { name: 'Emergency Fund', score: Math.round(emergencyScore), max: 25, c: '#065F46' },
          { name: 'SIP Consistency', score: Math.round(sipScore), max: 25, c: '#f59e0b' },
        ].map(row => (
          <div key={row.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.15rem' }}>
              <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{row.name}</span>
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: row.c }}>{row.score}/{row.max}</span>
            </div>
            <div style={{ height: '3px', borderRadius: '2px', background: 'var(--border)' }}>
              <div style={{ height: '100%', borderRadius: '2px', width: `${(row.score / row.max) * 100}%`, background: row.c, transition: 'width .8s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
