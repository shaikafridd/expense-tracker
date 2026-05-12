import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Expense, CATEGORY_CONFIG, Category } from '../types';
import { fmt } from '../utils';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  expenses: Expense[];
  totalSpent: number;
}

export default function SpendingChart({ expenses, totalSpent }: Props) {
  const catTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const labels = Object.keys(catTotals) as Category[];
  const values = labels.map((l) => catTotals[l]);
  const hexes  = labels.map((l) => CATEGORY_CONFIG[l]?.hex ?? '#94a3b8');

  if (labels.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '0.5rem' }}>
        <span style={{ fontSize: '2rem' }}>📊</span>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No data yet — add an expense!</p>
      </div>
    );
  }

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: hexes.map((h) => h + 'bb'),
      borderColor: hexes,
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverOffset: 10,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#131528',
        borderColor: '#252b4a',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => {
            const total = values.reduce((a, b) => a + b, 0);
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            return ` ${fmt(ctx.parsed)}  (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div>
      {/* Donut with centre label */}
      <div style={{ position: 'relative', height: '200px', marginBottom: '1.25rem' }}>
        <Pie data={data} options={options as any} />
        {/* Centre total */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Total Spent</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {fmt(totalSpent)}
          </span>
        </div>
      </div>

      {/* Legend pills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {labels.map((label, i) => {
          const cfg = CATEGORY_CONFIG[label];
          const total = values.reduce((a, b) => a + b, 0);
          const pct = total > 0 ? ((values[i] / total) * 100).toFixed(0) : '0';
          return (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.625rem', borderRadius: '10px',
              background: cfg.bg, border: `1px solid ${cfg.hex}28`,
            }}>
              <span style={{ fontSize: '1rem' }}>{cfg.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: cfg.color }}>{label}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pct}%</span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {fmt(values[i])}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
