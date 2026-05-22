import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Food', 'Travel', 'Bills', 'Fun'],
        message: '{VALUE} is not a valid category',
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for fast per-user filtering and sorting
expenseSchema.index({ user_id: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

// Ensure JSON output formats the date field as YYYY-MM-DD
expenseSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    if (ret.date) {
      // Formats Date to YYYY-MM-DD, taking timezone into account
      const dateObj = new Date(ret.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      ret.date = `${year}-${month}-${day}`;
    }
    return ret;
  },
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
