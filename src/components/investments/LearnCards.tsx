import React from 'react';
import { BookOpen } from 'lucide-react';

const CARDS = [
  { title: 'What is SIP?', emoji: '💰', front: 'Systematic Investment Plan', back: 'A SIP lets you invest a fixed amount every month into mutual funds. It averages your purchase cost over time (rupee cost averaging) and builds wealth through compounding.' },
  { title: 'What is ETF?', emoji: '📊', front: 'Exchange Traded Fund', back: 'An ETF is a basket of securities that tracks an index like Nifty 50. It trades on the stock exchange like a regular share, with very low expense ratios.' },
  { title: 'Risk vs Return', emoji: '⚖️', front: 'Higher Risk = Higher Potential', back: 'Low-risk investments (FDs, debt funds) give 6-8% returns. High-risk ones (equity, small-cap) can give 12-20% but with more volatility. Balance based on your goals.' },
  { title: 'Compound Growth', emoji: '🚀', front: 'The 8th Wonder of the World', back: 'Compounding means earning returns on your returns. ₹5,000/month at 12% for 20 years = ₹49.9L (you invested only ₹12L). Start early!' },
  { title: 'Emergency Fund', emoji: '🛡️', front: '6 Months of Expenses', back: 'Before investing, save 6 months of living expenses in a liquid fund or savings account. This protects you from selling investments during emergencies.' },
];

export default function LearnCards() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(6,182,212,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={16} color="#06b6d4" />
        </div>
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '.95rem' }}>Learn Investing</span>
        <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginLeft: '.25rem' }}>Hover to flip →</span>
      </div>
      <div className="inv-grid-5">
        {CARDS.map(c => (
          <div key={c.title} className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <span style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{c.emoji}</span>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '.25rem' }}>{c.title}</p>
                <p style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{c.front}</p>
              </div>
              <div className="flip-card-back">
                <p style={{ fontSize: '.78rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{c.back}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
