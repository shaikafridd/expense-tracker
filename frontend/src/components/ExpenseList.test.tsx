import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseFeed from './ExpenseList';
import { Expense } from '../types';

describe('ExpenseFeed Component', () => {
  const mockDelete = jest.fn();

  const mockExpenses: Expense[] = [
    {
      id: '1',
      created_at: '2026-05-22T00:00:00Z',
      user_id: 'user123',
      title: 'Groceries',
      amount: 45.5,
      category: 'Food',
      date: '2026-05-22',
    },
    {
      id: '2',
      created_at: '2026-05-22T00:00:00Z',
      user_id: 'user123',
      title: 'Internet',
      amount: 60.0,
      category: 'Bills',
      date: '2026-05-20',
    },
  ];

  beforeEach(() => {
    mockDelete.mockClear();
  });

  it('renders "Nothing here yet" when list is empty', () => {
    render(<ExpenseFeed expenses={[]} onDelete={mockDelete} />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.getByText(/Tap/)).toBeInTheDocument();
  });

  it('renders a list of expenses correctly', () => {
    render(<ExpenseFeed expenses={mockExpenses} onDelete={mockDelete} />);
    
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Internet')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Bills')).toBeInTheDocument();
    
    // Amount formatting check (fmt is $fmt or just currency format)
    expect(screen.getByText('₹45.5')).toBeInTheDocument();
    expect(screen.getByText('₹60')).toBeInTheDocument();
  });

  it('triggers onDelete when delete button is clicked', () => {
    render(<ExpenseFeed expenses={mockExpenses} onDelete={mockDelete} />);
    
    const deleteBtns = screen.getAllByTitle('Delete');
    expect(deleteBtns).toHaveLength(2);
    
    fireEvent.click(deleteBtns[0]);
    expect(mockDelete).toHaveBeenCalledWith('1');
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});
