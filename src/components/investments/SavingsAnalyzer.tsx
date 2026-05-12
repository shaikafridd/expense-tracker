import React from 'react';
import { Wallet, Shield, TrendingUp, Sparkles } from 'lucide-react';
import { fmt } from '../../utils';

interface Props { budget: number; spent: number; }

function CircleProgress({ pct, color, size = 80, label, value }: { pct: number; color: string; size?: number; label: string; value: string }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(45,106,79,.12)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '.95rem', fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

export default function SavingsAnalyzer({ budget, spent }: Props) {
  const savings = Math.max(0, budget - spent);
  const safeToInvest = Math.round(savings * 0.6);
  const emergency = savings - safeToInvest;
  const savingsRate = budget > 0 ? (savings / budget) * 100 : 0;

  return (
    <div className="glass-card neon-pulse" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Orb */}
      <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,.15), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={16} color="#10b981" />
        </div>
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '.95rem' }}>Smart Savings Analyzer</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1.25rem' }}>
        <CircleProgress pct={savingsRate} color="#10b981" label="Savings" value={fmt(savings)} />
        <CircleProgress pct={safeToInvest > 0 ? 60 : 0} color="#06b6d4" label="Safe to Invest" value={fmt(safeToInvest)} />
        <CircleProgress pct={emergency > 0 ? 40 : 0} color="#065F46" label="Emergency" value={fmt(emergency)} />
      </div>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem' }}>
        {[
          { icon: <Wallet size={12} />, label: 'Budget', val: fmt(budget), c: '#065F46' },
          { icon: <TrendingUp size={12} />, label: 'Spent', val: fmt(spent), c: '#f59e0b' },
          { icon: <Shield size={12} />, label: 'Rate', val: `${savingsRate.toFixed(0)}%`, c: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,.04)', borderRadius: '10px', padding: '.5rem', border: '1px solid rgba(255,255,255,.06)', textAlign: 'center' }}>
            <div style={{ color: s.c, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.2rem', marginBottom: '.15rem' }}>
              {s.icon}<span style={{ fontSize: '.55rem', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '.8rem', fontWeight: 700 }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
