import React from 'react';
import SavingsAnalyzer from './investments/SavingsAnalyzer';
import HealthScore from './investments/HealthScore';
import AICards from './investments/AICards';
import SIPSection from './investments/SIPSection';
import ETFSection from './investments/ETFSection';
import GoalPlanner from './investments/GoalPlanner';
import LearnCards from './investments/LearnCards';

interface Props { budget: number; spent: number; }

export default function InvestmentsPage({ budget, spent }: Props) {
  return (
    <div style={{ position: 'relative', minHeight: '60vh' }}>
      {/* Floating orbs */}
      <div style={{ position: 'absolute', top: '-60px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,106,79,.1), transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '-80px', right: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,.08), transparent 70%)', pointerEvents: 'none', filter: 'blur(50px)' }} />
      <div style={{ position: 'absolute', top: '40%', left: '50%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,.06), transparent 70%)', pointerEvents: 'none', filter: 'blur(50px)' }} />

      {/* Floating emoji particles */}
      <div className="float-anim" style={{ position: 'absolute', top: '5%', right: '8%', fontSize: '1.5rem', opacity: .15, pointerEvents: 'none' }}>💰</div>
      <div className="float-anim" style={{ position: 'absolute', top: '30%', left: '3%', fontSize: '1.3rem', opacity: .12, pointerEvents: 'none', animationDelay: '1s' }}>₹</div>
      <div className="float-anim" style={{ position: 'absolute', bottom: '20%', right: '5%', fontSize: '1.4rem', opacity: .1, pointerEvents: 'none', animationDelay: '2s' }}>📈</div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Row 1: Savings + Health Score */}
        <div className="inv-grid-2">
          <SavingsAnalyzer budget={budget} spent={spent} />
          <HealthScore budget={budget} spent={spent} />
        </div>

        {/* Row 2: AI Cards */}
        <AICards budget={budget} spent={spent} />

        {/* Row 3: SIP Section */}
        <SIPSection />

        {/* Row 4: Goal Planner + Simulator */}
        <GoalPlanner />

        {/* Row 5: ETF Discovery */}
        <ETFSection />

        {/* Row 6: Learn Cards */}
        <LearnCards />
      </div>
    </div>
  );
}
