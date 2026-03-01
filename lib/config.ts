/**
 * Application Configuration and Constants
 */

// Budget constraints
export const BUDGET_CONFIG = {
  MIN_MONTHLY_INCOME: 5000,
  MAX_MONTHLY_INCOME: 500000,
  MIN_MONTHLY_BUDGET: 2000,
  MIN_SAVINGS_TARGET: 10000,
  MAX_SAVINGS_TARGET: 5000000,
  WEEKS_PER_MONTH: 4,
  DAYS_PER_MONTH: 30,
} as const;

// Spending health thresholds
export const SPENDING_THRESHOLDS = {
  EXCELLENT: 50, // < 50% budget used
  GOOD: 80, // 50-80% budget used
  FAIR: 100, // 80-100% budget used
  POOR: 100, // > 100% budget used
} as const;

// Intervention severity thresholds
export const INTERVENTION_THRESHOLDS = {
  CRITICAL: 100, // Over 100% of budget
  HIGH: 85, // 85-100% of budget
  MEDIUM: 60, // 60-85% of budget
  LOW: 0, // < 60% of budget
} as const;

// Category definitions
export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍽️' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'utilities', label: 'Utilities', icon: '💡' },
  { id: 'other', label: 'Other', icon: '📦' },
] as const;

// Savings goal options
export const SAVINGS_GOALS = [
  { id: 'emergency', label: 'Emergency Fund' },
  { id: 'vacation', label: 'Vacation' },
  { id: 'education', label: 'Education' },
  { id: 'home', label: 'Home' },
  { id: 'investment', label: 'Investment' },
  { id: 'other', label: 'Other' },
] as const;

// API configuration
export const API_CONFIG = {
  TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Local storage keys (for non-sensitive data)
export const STORAGE_KEYS = {
  THEME: 'finguard_theme',
  UI_STATE: 'finguard_ui_state',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Invalid input. Please check your data.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
} as const;

// Gemma AI configuration
export const GEMMA_CONFIG = {
  MODEL: 'gemma-3-27b-it',
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
  TEMPERATURE: 0.85,
  MAX_OUTPUT_TOKENS: 500,
  TOP_P: 0.9,
  TOP_K: 30,
} as const;

// Rate limiting
export const RATE_LIMITS = {
  INTERVENTION_CALLS_PER_MINUTE: 10,
  INSIGHTS_CALLS_PER_MINUTE: 5,
} as const;
