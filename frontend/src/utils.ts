import { Budget } from './types';

const BUDGET_KEY = 'gravity_budget_v2';

export function loadBudget(): Budget {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    return raw ? JSON.parse(raw) : { monthly: 0 };
  } catch { return { monthly: 0 }; }
}

export function saveBudget(budget: Budget): void {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
}

export function fmt(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}

export function fmtDate(iso: string): string {
  // Construct as local date to avoid UTC-to-local off-by-one shift
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentYearMonth(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

export function isThisMonth(iso: string): boolean {
  return iso.startsWith(currentYearMonth());
}
