import type { Category } from '../types';

const LS_KEY = 'gravity_expenses_v2';

interface SeedRow {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  created_at: string;
}

const FOOD_ITEMS = [
  { t: 'Swiggy order', min: 250, max: 800 },
  { t: 'Chai + samosa', min: 40, max: 120 },
  { t: 'Grocery - BigBasket', min: 1500, max: 5000 },
  { t: 'Zomato dinner', min: 400, max: 1200 },
  { t: 'Office lunch', min: 150, max: 350 },
  { t: 'Fruits & veggies', min: 300, max: 800 },
  { t: 'Coffee - Starbucks', min: 350, max: 650 },
  { t: 'Milk & bread', min: 100, max: 250 },
  { t: 'Restaurant dinner', min: 1500, max: 4000 },
  { t: 'Party food order', min: 2000, max: 6000 },
  { t: 'Monthly ration', min: 3000, max: 8000 },
];

const TRAVEL_ITEMS = [
  { t: 'Uber to office', min: 200, max: 500 },
  { t: 'Metro recharge', min: 500, max: 1000 },
  { t: 'Auto rickshaw', min: 80, max: 250 },
  { t: 'Petrol fill-up', min: 2000, max: 5000 },
  { t: 'Rapido bike taxi', min: 100, max: 300 },
  { t: 'Ola cab - airport', min: 800, max: 2500 },
  { t: 'Train tickets', min: 500, max: 3000 },
  { t: 'Flight tickets', min: 3000, max: 15000 },
  { t: 'Toll charges', min: 100, max: 500 },
  { t: 'Car service', min: 3000, max: 12000 },
];

const BILLS_ITEMS = [
  { t: 'Electricity bill', min: 1500, max: 4000 },
  { t: 'WiFi - Airtel', min: 800, max: 1500 },
  { t: 'Mobile recharge', min: 299, max: 999 },
  { t: 'Netflix subscription', min: 199, max: 649 },
  { t: 'Water bill', min: 300, max: 800 },
  { t: 'Spotify Premium', min: 119, max: 119 },
  { t: 'House rent', min: 15000, max: 35000 },
  { t: 'Insurance premium', min: 2000, max: 8000 },
  { t: 'Credit card payment', min: 5000, max: 25000 },
  { t: 'EMI payment', min: 8000, max: 20000 },
  { t: 'Society maintenance', min: 2000, max: 5000 },
  { t: 'Gas cylinder', min: 800, max: 1200 },
];

const FUN_ITEMS = [
  { t: 'Movie tickets - PVR', min: 500, max: 1500 },
  { t: 'Amazon purchase', min: 500, max: 8000 },
  { t: 'Weekend outing', min: 1000, max: 5000 },
  { t: 'Gaming subscription', min: 299, max: 799 },
  { t: 'Books - Flipkart', min: 200, max: 1000 },
  { t: 'Gym membership', min: 1500, max: 3000 },
  { t: 'Gadget purchase', min: 2000, max: 25000 },
  { t: 'Clothing - Myntra', min: 1000, max: 6000 },
  { t: 'Concert tickets', min: 1500, max: 5000 },
  { t: 'Spa & wellness', min: 1000, max: 3000 },
];

const POOLS: Record<Category, typeof FOOD_ITEMS> = {
  Food: FOOD_ITEMS,
  Travel: TRAVEL_ITEMS,
  Bills: BILLS_ITEMS,
  Fun: FUN_ITEMS,
};

// Weighted distribution
const WEIGHTED_CATS: Category[] = [
  'Food', 'Food', 'Food', 'Food', 'Food',
  'Travel', 'Travel', 'Travel',
  'Bills', 'Bills', 'Bills', 'Bills',
  'Fun', 'Fun', 'Fun',
];

function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function seedDemoExpenses(): void {
  // Always ensure budget is set (even if expenses already exist)
  const BUDGET_KEY = 'gravity_budget_v2';
  if (!localStorage.getItem(BUDGET_KEY)) {
    localStorage.setItem(BUDGET_KEY, JSON.stringify({ monthly: 10000000 }));
  }

  // Only seed expenses into an empty state
  const existing = localStorage.getItem(LS_KEY);
  if (existing) {
    try {
      const arr = JSON.parse(existing);
      if (Array.isArray(arr) && arr.length > 0) return;
    } catch { /* corrupted — re-seed */ }
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (April = 3)
  const today = now.getDate();
  const rows: SeedRow[] = [];

  // Generate from January (month 0) through current month
  const startMonth = 0; // January

  for (let m = startMonth; m <= currentMonth; m++) {
    const maxDay = m === currentMonth ? today : daysInMonth(currentYear, m);
    // 30-45 expenses per month for a high-budget lifestyle
    const count = rand(30, 45);

    for (let i = 0; i < count; i++) {
      const day = rand(1, maxDay);
      const cat = WEIGHTED_CATS[rand(0, WEIGHTED_CATS.length - 1)];
      const pool = POOLS[cat];
      const item = pool[rand(0, pool.length - 1)];
      const amount = rand(item.min, item.max);
      const dateStr = `${currentYear}-${pad(m + 1)}-${pad(day)}`;

      rows.push({
        id: `demo-${crypto.randomUUID()}`,
        title: item.t,
        amount,
        category: cat,
        date: dateStr,
        created_at: new Date(currentYear, m, day, rand(7, 23), rand(0, 59)).toISOString(),
      });
    }
  }

  // Sort by date descending
  rows.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));

  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}
