import React from 'react';
import { render, screen } from '@testing-library/react';
import SpendingChart from './CategoryChart';
import { Expense } from '../types';

describe('SpendingChart Component', () => {
  const mockExpenses: Expense[] = [
    { id: '1', created_at: '', user_id: 'user1', title: 'Food A', amount: 40, category: 'Food', date: '2026-05-01' },
    { id: '2', created_at: '', user_id: 'user1', title: 'Ticket', amount: 60, category: 'Travel', date: '2026-05-02' },
  ];

  it('renders empty chart warning when no expenses provided', () => {
    render(<SpendingChart expenses={[]} totalSpent={0} />);
    expect(screen.getByText('No data yet — add an expense!')).toBeInTheDocument();
  });

  it('renders total spent and custom legend cards when expenses are provided', () => {
    render(<SpendingChart expenses={mockExpenses} totalSpent={100} />);
    
    // Total spent label
    expect(screen.getByText('Total Spent')).toBeInTheDocument();
    expect(screen.getByText('₹100')).toBeInTheDocument();

    // Mocked pie chart
    expect(screen.getByTestId('mock-pie-chart')).toBeInTheDocument();

    // Category legends
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Travel')).toBeInTheDocument();
    
    // Percentages: Food is 40/100 = 40%, Travel is 60/100 = 60%
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();

    // Amount displays
    expect(screen.getByText('₹40')).toBeInTheDocument();
    expect(screen.getByText('₹60')).toBeInTheDocument();
  });
});
