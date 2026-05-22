import React from 'react';
import { render, screen } from '@testing-library/react';
import AnalyticsCard from './AnalyticsCard';
import { Expense } from '../types';

describe('AnalyticsCard Component', () => {
  const mockExpenses: Expense[] = [
    { id: '1', created_at: '', user_id: 'user1', title: 'Food A', amount: 100, category: 'Food', date: '2026-05-01' },
    { id: '2', created_at: '', user_id: 'user1', title: 'Rent', amount: 500, category: 'Bills', date: '2026-05-02' },
  ];

  it('renders empty analytics message when no expenses provided', () => {
    render(<AnalyticsCard expenses={[]} monthExpenses={[]} budget={0} />);
    expect(screen.getByText(/Add expenses to see your analytics/i)).toBeInTheDocument();
  });

  it('renders projected spend and safe-to-spend per day', () => {
    // Current date is mockable, but we can test with stable input
    render(<AnalyticsCard expenses={mockExpenses} monthExpenses={mockExpenses} budget={1000} />);
    
    expect(screen.getByText('Spending Analytics')).toBeInTheDocument();
    expect(screen.getByText('Projected')).toBeInTheDocument();
    expect(screen.getByText('Safe / Day')).toBeInTheDocument();
  });

  it('displays over-budget warning when projected exceeds budget', () => {
    // Set low budget so projected is higher
    render(<AnalyticsCard expenses={mockExpenses} monthExpenses={mockExpenses} budget={100} />);
    
    expect(screen.getByText(/At your current pace you'll overshoot your budget/i)).toBeInTheDocument();
  });

  it('displays category percentage breakdown and biggest expense', () => {
    render(<AnalyticsCard expenses={mockExpenses} monthExpenses={mockExpenses} budget={1000} />);
    
    // Category checks
    expect(screen.getByText('Bills')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    
    // Biggest expense checks
    expect(screen.getByText('Biggest Expense')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getAllByText('₹500').length).toBeGreaterThanOrEqual(1);
  });
});
