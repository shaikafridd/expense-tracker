import express from 'express';
import passport from 'passport';
import {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getCategoryTotals,
  getMonthlySummary,
} from '../controllers/expenseController.js';

const router = express.Router();

// Apply JWT authentication middleware to all routes in this file
router.use(passport.authenticate('jwt', { session: false }));

// Expense aggregates (specific paths first)
router.get('/category-totals', getCategoryTotals);
router.get('/monthly-summary', getMonthlySummary);

// Expense CRUD operations (general paths second)
router.get('/', getExpenses);
router.post('/', addExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
