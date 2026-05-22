import React, { useState } from 'react';
import { Search, TrendingUp, BarChart2 } from 'lucide-react';

type Filter = 'All' | 'Low Risk' | 'High Growth' | 'Long-Term' | 'Dividend';

const ETFS = [
  { name: 'Nifty 50 ETF', ticker: 'NIFTYBEES', ret1y: 14.2, ret3y: 12.8, expense: 0.04, risk: 'Low Risk' as Filter, tags: ['Low Risk', 'Long-Term'] as Filter[], color: '#065F46', emoji: '📈' },
  { name: 'Gold ETF', ticker: 'GOLDBEES', ret1y: 18.5, ret3y: 11.2, expense: 0.5, risk: 'Low Risk' as Filter, tags: ['Low Risk', 'Dividend'] as Filter[], color: '#f59e0b', emoji: '🥇' },
  { name: 'Banking ETF', ticker: 'BANKBEES', ret1y: 9.8, ret3y: 15.1, expense: 0.19, risk: 'High Growth' as Filter, tags: ['High Growth', 'Dividend'] as Filter[], color: '#06b6d4', emoji: '🏦' },
  { name: 'IT ETF', ticker: 'ITBEES', ret1y: 22.3, ret3y: 18.4, expense: 0.12, risk: 'High Growth' as Filter, tags: ['High Growth', 'Long-Term'] as Filter[], color: '#10b981', emoji: '💻' },
  { name: 'International ETF', ticker: 'N100', ret1y: 25.1, ret3y: 20.2, expense: 0.48, risk: 'High Growth' as Filter, tags: ['High Growth', 'Long-Term'] as Filter[], color: '#ec4899', emoji: '🌍' },
];
const FILTERS: Filter[] = ['All', 'Low Risk', 'High Growth', 'Long-Term', 'Dividend'];

export default function ETFSection() {
  const [filter, setFilter] = useState<Filter>('All');
  const filtered = filter === 'All' ? ETFS : ETFS.filter(e => e.tags.includes(filter));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(236,72,153,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={16} color="#ec4899" />
        </div>
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '.95rem' }}>ETF Discovery</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.375rem', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* ETF Cards */}
      <div className="inv-grid-5">
        {filtered.map(etf => (
          <div key={etf.ticker} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{etf.emoji}</span>
              <div>
                <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{etf.name}</div>
                <span style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontFamily: "'Inter',sans-serif" }}>{etf.ticker}</span>
              </div>
            </div>
            {/* Mini bar chart */}
            <svg width="100%" height={30} viewBox="0 0 100 30">
              {[...Array(12)].map((_, i) => {
                const h = 8 + Math.random() * 18;
                return <rect key={i} x={i * 8.3} y={30 - h} width={5} height={h} rx={2} fill={`${etf.color}${i < 8 ? '55' : 'cc'}`} />;
              })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>1Y Return</span>
              <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#10b981', fontFamily: "'Inter',sans-serif" }}>+{etf.ret1y}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>3Y Return</span>
              <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#06b6d4', fontFamily: "'Inter',sans-serif" }}>+{etf.ret3y}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>Expense Ratio</span>
              <span style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text2)' }}>{etf.expense}%</span>
            </div>
            <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap' }}>
              {etf.tags.map(t => <span key={t} className="chip" style={{ fontSize: '.6rem', padding: '.15rem .45rem' }}>{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
