import {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getCategoryTotals,
  getMonthlySummary,
} from '../src/controllers/expenseController.js';
import Expense from '../src/models/Expense.js';

jest.mock('../src/models/Expense.js');

describe('Expense Controller Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: { _id: 'userid123' },
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('addExpense', () => {
    it('should create an expense and return it', async () => {
      mockReq.body = {
        title: 'Lunch',
        amount: 25.5,
        category: 'Food',
        date: '2026-05-22'
      };

      const mockCreatedExpense = {
        id: 'expenseid123',
        user_id: 'userid123',
        title: 'Lunch',
        amount: 25.5,
        category: 'Food',
        date: new Date('2026-05-22')
      };
      Expense.create.mockResolvedValue(mockCreatedExpense);

      await addExpense(mockReq, mockRes, mockNext);

      expect(Expense.create).toHaveBeenCalledWith({
        user_id: 'userid123',
        title: 'Lunch',
        amount: 25.5,
        category: 'Food',
        date: new Date('2026-05-22')
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockCreatedExpense);
    });
  });

  describe('getExpenses', () => {
    it('should query user-specific expenses with filter options', async () => {
      mockReq.query = {
        category: 'Food',
        from: '2026-05-01',
        to: '2026-05-31',
        limit: '10'
      };

      const mockExpenses = [
        { id: '1', title: 'Lunch', amount: 15 },
        { id: '2', title: 'Dinner', amount: 30 }
      ];

      // Setup chainable mock for Mongoose find().sort().limit()
      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockExpenses)
      };
      Expense.find.mockReturnValue(mockQueryChain);

      await getExpenses(mockReq, mockRes, mockNext);

      // Verify date filter is applied correctly
      const expectedFilter = {
        user_id: 'userid123',
        category: 'Food',
        date: {
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        }
      };

      expect(Expense.find).toHaveBeenCalledWith(expectedFilter);
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ date: -1, created_at: -1 });
      expect(mockQueryChain.limit).toHaveBeenCalledWith(10);
      expect(mockRes.json).toHaveBeenCalledWith(mockExpenses);
    });
  });

  describe('updateExpense', () => {
    it('should update an owned expense and return it', async () => {
      mockReq.params.id = 'expense123';
      mockReq.body = { title: 'Dinner Updated' };

      const mockExpenseObj = {
        _id: 'expense123',
        user_id: 'userid123',
        title: 'Dinner',
        amount: 30,
        category: 'Food',
        save: jest.fn().mockResolvedValue(true)
      };

      Expense.findOne.mockResolvedValue(mockExpenseObj);

      await updateExpense(mockReq, mockRes, mockNext);

      expect(Expense.findOne).toHaveBeenCalledWith({ _id: 'expense123', user_id: 'userid123' });
      expect(mockExpenseObj.title).toBe('Dinner Updated');
      expect(mockExpenseObj.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockExpenseObj);
    });

    it('should return 404 if expense is not found or not owned', async () => {
      mockReq.params.id = 'expense123';
      Expense.findOne.mockResolvedValue(null);

      await updateExpense(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Expense not found or unauthorized' });
    });
  });

  describe('deleteExpense', () => {
    it('should delete an owned expense', async () => {
      mockReq.params.id = 'expense123';
      Expense.findOneAndDelete.mockResolvedValue({ _id: 'expense123' });

      await deleteExpense(mockReq, mockRes, mockNext);

      expect(Expense.findOneAndDelete).toHaveBeenCalledWith({ _id: 'expense123', user_id: 'userid123' });
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Expense deleted successfully' });
    });
  });

  describe('getCategoryTotals', () => {
    it('should return category aggregate totals', async () => {
      const mockAggResult = [
        { category: 'Food', total: 100 },
        { category: 'Bills', total: 300 }
      ];
      Expense.aggregate.mockResolvedValue(mockAggResult);

      await getCategoryTotals(mockReq, mockRes, mockNext);

      expect(Expense.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockAggResult);
    });
  });

  describe('getMonthlySummary', () => {
    it('should return aggregate monthly summary', async () => {
      const mockAggResult = [{ total_spent: 400, tx_count: 5 }];
      Expense.aggregate.mockResolvedValue(mockAggResult);

      await getMonthlySummary(mockReq, mockRes, mockNext);

      expect(Expense.aggregate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        total_spent: 400,
        tx_count: 5,
        avg_per_day: expect.any(Number)
      });
    });
  });
});
