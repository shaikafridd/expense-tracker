import {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getCategoryTotals,
  getMonthlySummary,
  ExpenseRow
} from './expenseApi';
import { auth, apiFetch } from './apiClient';

jest.mock('./apiClient');

describe('expenseApi', () => {
  const mockUser = { id: 'user-123', email: 'user@example.com', user_metadata: { full_name: 'Test' } };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    
    // Mock crypto.randomUUID for environments where it is undefined
    if (typeof crypto.randomUUID === 'undefined') {
      Object.defineProperty(crypto, 'randomUUID', {
        value: jest.fn().mockReturnValue('mocked-uuid'),
        configurable: true,
      });
    }
  });

  describe('LocalStorage Mode (No User Session)', () => {
    beforeEach(() => {
      (auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
    });

    it('should add expense to localStorage and return the row', async () => {
      const payload = {
        title: 'Snacks',
        amount: 5.5,
        category: 'Food' as const,
        date: '2026-05-22',
      };

      const result = await addExpense(payload);

      expect(result.title).toBe(payload.title);
      expect(result.amount).toBe(payload.amount);
      expect(result.user_id).toBe('local');
      expect(result.id).toBeDefined();

      const stored = JSON.parse(localStorage.getItem('gravity_expenses_v2') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].title).toBe('Snacks');
    });

    it('should query, update and delete from localStorage', async () => {
      const initial: ExpenseRow = {
        id: '123',
        created_at: new Date().toISOString(),
        user_id: 'local',
        title: 'Rent',
        amount: 800,
        category: 'Bills',
        date: '2026-05-01',
      };
      localStorage.setItem('gravity_expenses_v2', JSON.stringify([initial]));

      // Test Get
      const expenses = await getExpenses();
      expect(expenses).toHaveLength(1);
      expect(expenses[0].title).toBe('Rent');

      // Test Update
      const updated = await updateExpense('123', { amount: 850 });
      expect(updated.amount).toBe(850);
      
      const storedAfterUpdate = JSON.parse(localStorage.getItem('gravity_expenses_v2') || '[]');
      expect(storedAfterUpdate[0].amount).toBe(850);

      // Test Delete
      await deleteExpense('123');
      const storedAfterDelete = JSON.parse(localStorage.getItem('gravity_expenses_v2') || '[]');
      expect(storedAfterDelete).toHaveLength(0);
    });

    it('should aggregate category totals locally', async () => {
      const data: ExpenseRow[] = [
        { id: '1', created_at: '', user_id: 'local', title: 'A', amount: 50, category: 'Food', date: '2026-05-01' },
        { id: '2', created_at: '', user_id: 'local', title: 'B', amount: 30, category: 'Food', date: '2026-05-02' },
        { id: '3', created_at: '', user_id: 'local', title: 'C', amount: 100, category: 'Bills', date: '2026-05-03' },
      ];
      localStorage.setItem('gravity_expenses_v2', JSON.stringify(data));

      const totals = await getCategoryTotals();
      expect(totals).toEqual([
        { category: 'Bills', total: 100 },
        { category: 'Food', total: 80 },
      ]);
    });

    it('should compute monthly summary locally', async () => {
      const currentYearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const data: ExpenseRow[] = [
        { id: '1', created_at: '', user_id: 'local', title: 'A', amount: 40, category: 'Food', date: `${currentYearMonth}-05` },
        { id: '2', created_at: '', user_id: 'local', title: 'B', amount: 60, category: 'Travel', date: `${currentYearMonth}-10` },
      ];
      localStorage.setItem('gravity_expenses_v2', JSON.stringify(data));

      const summary = await getMonthlySummary();
      expect(summary.total_spent).toBe(100);
      expect(summary.tx_count).toBe(2);
      expect(summary.avg_per_day).toBeCloseTo(100 / new Date().getDate(), 4);
    });
  });

  describe('Express/MongoDB Mode (Authenticated User)', () => {
    beforeEach(() => {
      (auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    it('should add expense via backend API on success', async () => {
      const payload = {
        title: 'Taxi',
        amount: 15,
        category: 'Travel' as const,
        date: '2026-05-22',
      };

      const mockResponse = { ...payload, id: 'db-id', user_id: mockUser.id, created_at: '2026-05-22T00:00:00Z' };
      (apiFetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await addExpense(payload);

      expect(apiFetch).toHaveBeenCalledWith('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should query expenses with filters from backend API', async () => {
      const mockList = [
        { id: '1', title: 'A', amount: 10, category: 'Food', date: '2026-05-01' }
      ];
      (apiFetch as jest.Mock).mockResolvedValueOnce(mockList);

      const result = await getExpenses({ category: 'Food', from: '2026-05-01', to: '2026-05-10', limit: 5 });

      expect(apiFetch).toHaveBeenCalledWith('/expenses?category=Food&from=2026-05-01&to=2026-05-10&limit=5');
      expect(result).toEqual(mockList);
    });

    it('should update and delete using backend endpoints', async () => {
      // Test Update
      const mockUpdated = { id: '123', title: 'Updated' };
      (apiFetch as jest.Mock).mockResolvedValueOnce(mockUpdated);

      const updateResult = await updateExpense('123', { title: 'Updated' });
      expect(apiFetch).toHaveBeenCalledWith('/expenses/123', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      expect(updateResult).toEqual(mockUpdated);

      // Test Delete
      (apiFetch as jest.Mock).mockResolvedValueOnce(undefined);

      await deleteExpense('123');
      expect(apiFetch).toHaveBeenCalledWith('/expenses/123', {
        method: 'DELETE',
      });
    });

    it('should fetch category totals and monthly summary from backend', async () => {
      // Test Totals
      const mockTotals = [{ category: 'Bills', total: 150 }];
      (apiFetch as jest.Mock).mockResolvedValueOnce(mockTotals);

      const totals = await getCategoryTotals({ from: '2026-05-01' });
      expect(apiFetch).toHaveBeenCalledWith('/expenses/category-totals?from=2026-05-01');
      expect(totals).toEqual(mockTotals);

      // Test Summary
      const mockSummary = { total_spent: 500, tx_count: 10, avg_per_day: 50 };
      (apiFetch as jest.Mock).mockResolvedValueOnce(mockSummary);

      const summary = await getMonthlySummary();
      expect(apiFetch).toHaveBeenCalledWith('/expenses/monthly-summary');
      expect(summary).toEqual(mockSummary);
    });
  });
});
