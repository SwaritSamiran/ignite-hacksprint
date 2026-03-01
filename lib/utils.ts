/**
 * Currency Formatting Utilities
 */
export function formatCurrency(amount: number, currency: string = 'Rs'): string {
  if (amount >= 10000000) {
    return `${currency}.${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `${currency}.${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${currency}.${(amount / 1000).toFixed(1)}K`;
  }
  return `${currency}.${amount.toFixed(0)}`;
}

export function formatCurrencyFull(amount: number, currency: string = 'Rs'): string {
  return `${currency}.${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Budget Calculation Utilities
 */
export interface BudgetStats {
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  projectedMonthEnd: number;
  projectedSavings: number;
  dailyAverage: number;
}

export function calculateBudgetStats(
  spent: number,
  budget: number,
  income: number,
  daysElapsed: number,
  daysInMonth: number
): BudgetStats {
  const remaining = Math.max(budget - spent, 0);
  const percentUsed = (spent / budget) * 100;
  const dailyAvg = daysElapsed > 0 ? spent / daysElapsed : 0;
  const projectedMonthEnd = Math.round(dailyAvg * daysInMonth);
  const projectedSavings = Math.max(income - projectedMonthEnd, 0);

  return {
    totalSpent: spent,
    remaining,
    percentUsed,
    projectedMonthEnd,
    projectedSavings,
    dailyAverage: dailyAvg,
  };
}

/**
 * Spending Health Evaluation
 */
export type SpendingHealth = 'excellent' | 'good' | 'fair' | 'poor';

export function evaluateSpendingHealth(percentUsed: number): SpendingHealth {
  if (percentUsed < 50) return 'excellent';
  if (percentUsed < 80) return 'good';
  if (percentUsed < 100) return 'fair';
  return 'poor';
}

/**
 * Budget Thresholds for Interventions
 */
export interface BudgetThresholds {
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'proceed' | 'caution' | 'stop';
}

export function getBudgetThreshold(percentAfterPurchase: number): BudgetThresholds {
  if (percentAfterPurchase > 100) {
    return { severity: 'critical', recommendation: 'stop' };
  }
  if (percentAfterPurchase > 85) {
    return { severity: 'high', recommendation: 'caution' };
  }
  if (percentAfterPurchase > 60) {
    return { severity: 'medium', recommendation: 'caution' };
  }
  return { severity: 'low', recommendation: 'proceed' };
}

/**
 * Date Utilities
 */
export function getDaysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDayOfMonth(date: Date = new Date()): number {
  return date.getDate();
}

export function getDaysElapsed(date: Date = new Date()): number {
  return getDayOfMonth(date);
}

export function getDaysRemaining(date: Date = new Date()): number {
  return getDaysInMonth(date) - getDayOfMonth(date);
}

export function isCurrentMonth(checkDate: Date, referenceDate: Date = new Date()): boolean {
  return (
    checkDate.getMonth() === referenceDate.getMonth() &&
    checkDate.getFullYear() === referenceDate.getFullYear()
  );
}

/**
 * Income Utilities
 */
export function calculateWeeklyBudget(monthlyBudget: number): number {
  return Math.round(monthlyBudget / 4);
}

export function calculateDailyBudget(monthlyBudget: number): number {
  return Math.round(monthlyBudget / 30);
}

/**
 * Savings Calculation
 */
export function calculateMonthsToSavingsGoal(monthlySavings: number, savingsTarget: number): number {
  if (monthlySavings <= 0) return Infinity;
  return Math.ceil(savingsTarget / monthlySavings);
}

/**
 * Category Color Mapping
 */
export const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-primary',
  transport: 'bg-accent',
  shopping: 'bg-secondary',
  entertainment: 'bg-amber-500',
  utilities: 'bg-cyan-500',
  other: 'bg-muted-foreground',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
}

/**
 * Error Handling
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
