import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddExpenseModal from './AddExpenseModal';
import BudgetModal from './BudgetModal';
import OverLimitModal from './OverLimitModal';
import { Category } from '../types';

describe('Modal Components', () => {
  
  describe('AddExpenseModal', () => {
    const mockAdd = jest.fn();
    const mockClose = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders AddExpenseModal inputs correctly', () => {
      render(<AddExpenseModal onAdd={mockAdd} onClose={mockClose} />);
      expect(screen.getByText('New Expense')).toBeInTheDocument();
      expect(document.getElementById('input-title')).toBeInTheDocument();
      expect(document.getElementById('input-amount')).toBeInTheDocument();
      expect(document.getElementById('input-date')).toBeInTheDocument();
    });

    it('validates required title and valid amount', () => {
      render(<AddExpenseModal onAdd={mockAdd} onClose={mockClose} />);
      const submitBtn = screen.getByRole('button', { name: /add expense/i });
      
      // Submit empty
      fireEvent.click(submitBtn);
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();

      // Enter title but no amount
      fireEvent.change(document.getElementById('input-title')!, { target: { value: 'Lunch' } });
      fireEvent.click(submitBtn);
      expect(screen.getByText(/Enter a valid amount/i)).toBeInTheDocument();
    });

    it('submits valid data and calls onAdd', () => {
      render(<AddExpenseModal onAdd={mockAdd} onClose={mockClose} />);
      
      fireEvent.change(document.getElementById('input-title')!, { target: { value: 'Movie' } });
      fireEvent.change(document.getElementById('input-amount')!, { target: { value: '500' } });
      
      // Select Travel Category
      const travelPill = screen.getByRole('button', { name: /✈️ Travel/i });
      fireEvent.click(travelPill);

      const submitBtn = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitBtn);

      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Movie',
        amount: 500,
        category: 'Travel',
      }));
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when clicking close button', () => {
      const { container } = render(<AddExpenseModal onAdd={mockAdd} onClose={mockClose} />);
      const closeBtn = container.querySelector('#modal-close-btn');
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn!);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('BudgetModal', () => {
    const mockSave = jest.fn();
    const mockClose = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders current budget if set', () => {
      render(<BudgetModal currentBudget={5000} onSave={mockSave} onClose={mockClose} />);
      expect(screen.getByText('Monthly Budget')).toBeInTheDocument();
      expect(screen.getByText('Current budget')).toBeInTheDocument();
      expect(screen.getByText('₹5,000')).toBeInTheDocument();
    });

    it('validates budget amount', () => {
      render(<BudgetModal currentBudget={0} onSave={mockSave} onClose={mockClose} />);
      const saveBtn = screen.getByRole('button', { name: /save budget/i });
      
      fireEvent.click(saveBtn);
      expect(screen.getByText(/Please enter a budget greater than ₹0/i)).toBeInTheDocument();
    });

    it('saves budget on valid input', () => {
      render(<BudgetModal currentBudget={0} onSave={mockSave} onClose={mockClose} />);
      
      fireEvent.change(screen.getByPlaceholderText('e.g. 50000'), { target: { value: '25000' } });
      
      const saveBtn = screen.getByRole('button', { name: /save budget/i });
      fireEvent.click(saveBtn);

      expect(mockSave).toHaveBeenCalledWith(25000);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('OverLimitModal', () => {
    const mockConfirm = jest.fn();
    const mockCancel = jest.fn();
    
    const pendingExpense = {
      title: 'Expensive Watch',
      amount: 1500,
      category: 'Fun' as Category,
      date: '2026-05-22',
      created_at: '',
      user_id: 'user-123',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders warnings and budget numbers', () => {
      render(
        <OverLimitModal
          pending={pendingExpense}
          totalSoFar={800}
          monthlyBudget={1000}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      expect(screen.getByText('Budget Limit Reached')).toBeInTheDocument();
      expect(screen.getByText('Expensive Watch')).toBeInTheDocument();
      expect(screen.getByText('Over budget by')).toBeInTheDocument();
      expect(screen.getByText('₹1,300')).toBeInTheDocument(); // new total 2300 - budget 1000 = 1300
    });

    it('triggers callback on Cancel or Confirm clicks', () => {
      render(
        <OverLimitModal
          pending={pendingExpense}
          totalSoFar={800}
          monthlyBudget={1000}
          onConfirm={mockConfirm}
          onCancel={mockCancel}
        />
      );

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);
      expect(mockCancel).toHaveBeenCalledTimes(1);

      const confirmBtn = screen.getByRole('button', { name: /add anyway/i });
      fireEvent.click(confirmBtn);
      expect(mockConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
