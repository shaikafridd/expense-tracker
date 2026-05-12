import React from 'react';
import { Lightbulb, TrendingUp, Shield, Zap } from 'lucide-react';
import { fmt } from '../../utils';

interface Props { budget: number; spent: number; }

const icons = [
  <Lightbulb size={16} color="#f59e0b" />,
  <TrendingUp size={16} color="#10b981" />,
  <Shield size={16} color="#06b6d4" />,
  <Zap size={16} color="#065F46" />,
];

export default function AICards({ budget, spent }: Props) {
  const savings = Math.max(0, budget - spent);
  const savingsRate = budget > 0 ? ((budget - spent) / budget) * 100 : 0;

  const tips: { text: string; color: string }[] = [];

  if (savingsRate > 20)
    tips.push({ text: `Your savings rate is ${savingsRate.toFixed(0)}%. Consider investing ${fmt(Math.round(savings * 0.4))} into a monthly SIP.`, color: '#10b981' });
  else if (budget > 0)
    tips.push({ text: `Your savings rate is low at ${savingsRate.toFixed(0)}%. Try cutting discretionary spending before investing.`, color: '#f59e0b' });

  if (savings > 10000)
    tips.push({ text: `You have ${fmt(savings)} in surplus. Consider adding a Gold ETF for portfolio diversification.`, color: '#06b6d4' });

  if (savingsRate > 30)
    tips.push({ text: `With ${savingsRate.toFixed(0)}% savings, you have enough cushion. You can now invest more aggressively.`, color: '#065F46' });

  if (budget === 0)
    tips.push({ text: 'Set a monthly budget first — it helps our AI give you better investment recommendations.', color: '#f59e0b' });

  if (tips.length === 0)
    tips.push({ text: 'Add more expenses so we can analyze your spending patterns and suggest investments.', color: '#065F46' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lightbulb size={16} color="#f59e0b" />
        </div>
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '.95rem' }}>AI Recommendations</span>
      </div>
      {tips.map((tip, i) => (
        <div key={i} className="ai-card glass-card" style={{ animationDelay: `${i * .12}s`, display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '1rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, background: `${tip.color}18`, border: `1px solid ${tip.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icons[i % icons.length]}
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.55, flex: 1 }}>{tip.text}</p>
        </div>
      ))}
    </div>
  );
}
