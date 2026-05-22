import Expense from '../models/Expense.js';

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
export const addExpense = async (req, res, next) => {
  const { title, amount, category, date } = req.body;

  try {
    const expense = await Expense.create({
      user_id: req.user._id,
      title,
      amount,
      category,
      date: date ? new Date(date) : undefined,
    });

    return res.status(201).json(expense);
  } catch (error) {
    return next(error);
  }
};

// @desc    Get all expenses for the current user with filters
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res, next) => {
  try {
    const { category, from, to, limit } = req.query;

    const filter = { user_id: req.user._id };

    if (category) {
      filter.category = category;
    }

    if (from || to) {
      filter.date = {};
      if (from) {
        // Set time to start of day
        const fromDate = new Date(from);
        fromDate.setUTCHours(0, 0, 0, 0);
        filter.date.$gte = fromDate;
      }
      if (to) {
        // Set time to end of day
        const toDate = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    const maxLimit = parseInt(limit, 10) || 500;

    const expenses = await Expense.find(filter)
      .sort({ date: -1, created_at: -1 })
      .limit(maxLimit);

    return res.json(expenses);
  } catch (error) {
    return next(error);
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res, next) => {
  const { id } = req.params;
  const { title, amount, category, date } = req.body;

  try {
    let expense = await Expense.findOne({ _id: id, user_id: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or unauthorized' });
    }

    if (title !== undefined) expense.title = title;
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = new Date(date);

    await expense.save();

    return res.json(expense);
  } catch (error) {
    return next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  const { id } = req.params;

  try {
    const expense = await Expense.findOneAndDelete({ _id: id, user_id: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or unauthorized' });
    }

    return res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get category totals aggregated
// @route   GET /api/expenses/category-totals
// @access  Private
export const getCategoryTotals = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setUTCHours(0, 0, 0, 0);

    const lastDay = new Date(today);
    lastDay.setUTCHours(23, 59, 59, 999);

    const startDate = from ? new Date(from) : firstDayOfMonth;
    const endDate = to ? new Date(to) : lastDay;

    // Adjust start/end times
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    const aggregation = await Expense.aggregate([
      {
        $match: {
          user_id: req.user._id,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          _id: 0,
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    return res.json(aggregation);
  } catch (error) {
    return next(error);
  }
};

// @desc    Get monthly summary (total, transaction count, daily avg)
// @route   GET /api/expenses/monthly-summary
// @access  Private
export const getMonthlySummary = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const summary = await Expense.aggregate([
      {
        $match: {
          user_id: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total_spent: { $sum: '$amount' },
          tx_count: { $sum: 1 },
        },
      },
    ]);

    const result = summary[0] || { total_spent: 0, tx_count: 0 };
    const day = today.getDate();
    const avg_per_day = day > 0 ? result.total_spent / day : 0;

    return res.json({
      total_spent: result.total_spent,
      tx_count: result.tx_count,
      avg_per_day: parseFloat(avg_per_day.toFixed(2)),
    });
  } catch (error) {
    return next(error);
  }
};
