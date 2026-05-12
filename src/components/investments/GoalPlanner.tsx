import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { fmt } from '../../utils';

function fv(monthly: number, years: number, rate: number): number {
  const r = rate / 12 / 100, n = years * 12;
  if (r === 0) return monthly * n;
  return Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

function sipNeeded(target: number, years: number, rate: number): number {
  const r = rate / 12 / 100, n = years * 12;
  if (r === 0) return Math.round(target / n);
  return Math.round((target * r) / (Math.pow(1 + r, n) - 1));
}

export default function GoalPlanner() {
  const [goal, setGoal] = useState(500000);
  const [years, setYears] = useState(5);
  const [rate] = useState(12);
  const [simMonthly, setSimMonthly] = useState(5000);
  const [simYears, setSimYears] = useState(10);

  const monthly = sipNeeded(goal, years, rate);
  const simFuture = fv(simMonthly, simYears, rate);
  const simInvested = simMonthly * simYears * 12;

  // Growth path data for SVG
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let y = 0; y <= simYears; y++) {
      const val = fv(simMonthly, y, rate);
      pts.push({ x: (y / simYears) * 280 + 10, y: 120 - (val / (simFuture || 1)) * 100 });
    }
    return pts;
  }, [simMonthly, simYears, simFuture, rate]);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Goal Planner ── */}
      <div className="glass-card neon-pulse" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,106,79,.12), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(45,106,79,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calculator size={16} color="#065F46" />
          </div>
          <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '.95rem' }}>Goal-Based Planner</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Goal slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.375rem' }}>
              <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Goal Amount</span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '.9rem', fontWeight: 700, color: '#065F46' }}>{fmt(goal)}</span>
            </div>
            <input type="range" className="inv-range" min={50000} max={10000000} step={50000} value={goal}
              onChange={e => setGoal(+e.target.value)}
              style={{ '--pct': `${((goal - 50000) / (10000000 - 50000)) * 100}%` } as React.CSSProperties} />
          </div>
          {/* Years slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.375rem' }}>
              <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Years</span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '.9rem', fontWeight: 700, color: '#06b6d4' }}>{years} yrs</span>
            </div>
            <input type="range" className="inv-range" min={1} max={30} value={years}
              onChange={e => setYears(+e.target.value)}
              style={{ '--pct': `${((years - 1) / 29) * 100}%` } as React.CSSProperties} />
          </div>

          {/* Result */}
          <div style={{ background: 'rgba(45,106,79,.08)', border: '1px solid rgba(45,106,79,.25)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '.25rem' }}>MONTHLY SIP NEEDED</p>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#065F46' }}>{fmt(monthly)}</p>
            <p style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>at {rate}% annual return</p>
          </div>
        </div>
      </div>

      {/* ── Simulator ── */}
      <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={16} color="#10b981" />
          </div>
          <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '.95rem' }}>Growth Simulator</span>
        </div>

        <div className="inv-grid-2" style={{ marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.375rem' }}>
              <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly</span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '.85rem', fontWeight: 700, color: '#10b981' }}>{fmt(simMonthly)}</span>
            </div>
            <input type="range" className="inv-range" min={500} max={100000} step={500} value={simMonthly}
              onChange={e => setSimMonthly(+e.target.value)}
              style={{ '--pct': `${((simMonthly - 500) / 99500) * 100}%` } as React.CSSProperties} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.375rem' }}>
              <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Duration</span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '.85rem', fontWeight: 700, color: '#06b6d4' }}>{simYears} yrs</span>
            </div>
            <input type="range" className="inv-range" min={1} max={30} value={simYears}
              onChange={e => setSimYears(+e.target.value)}
              style={{ '--pct': `${((simYears - 1) / 29) * 100}%` } as React.CSSProperties} />
          </div>
        </div>

        {/* Chart */}
        <svg width="100%" viewBox="0 0 300 130" style={{ marginBottom: '.75rem' }}>
          <defs>
            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity=".35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${pathD} L290,120 L10,120 Z`} fill="url(#growthGrad)" />
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round"
            strokeDasharray={2000} className="chart-path-anim" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,.5))' }} />
          {points.length > 0 && <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r={4} fill="#10b981" style={{ filter: 'drop-shadow(0 0 6px #10b981)' }} />}
        </svg>

        <div className="inv-grid-3">
          {[
            { label: 'Invested', val: fmt(simInvested), c: 'var(--text2)' },
            { label: 'Returns', val: fmt(simFuture - simInvested), c: '#10b981' },
            { label: 'Future Value', val: fmt(simFuture), c: '#065F46' },
          ].map(r => (
            <div key={r.label} style={{ background: 'rgba(255,255,255,.04)', borderRadius: '10px', padding: '.625rem', textAlign: 'center', border: '1px solid rgba(255,255,255,.06)' }}>
              <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.15rem' }}>{r.label}</p>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '.9rem', fontWeight: 700, color: r.c }}>{r.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
