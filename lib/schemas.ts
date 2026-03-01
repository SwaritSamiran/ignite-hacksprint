import { z } from 'zod';

// ============ AUTH SCHEMAS ============
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============ USER SCHEMAS ============
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export type User = z.infer<typeof UserSchema>;

// ============ PROFILE SCHEMAS ============
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  monthly_income: z.number().positive('Monthly income must be positive'),
  monthly_budget: z.number().positive('Monthly budget must be positive'),
  weekly_limit: z.number().positive(),
  savings_goal: z.enum(['emergency', 'vacation', 'education', 'home', 'investment', 'other']),
  savings_target: z.number().positive('Savings target must be positive'),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileUpdateSchema = ProfileSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

// ============ EXPENSE SCHEMAS ============
export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum(['food', 'transport', 'shopping', 'entertainment', 'utilities', 'other']),
  description: z.string().optional().default(''),
  date: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const ExpenseCreateSchema = ExpenseSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
  date: true,
}).extend({
  date: z.string().datetime({ offset: true }).optional(),
});

export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;

// ============ INTERVENTION SCHEMAS ============
export const SeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const RecommendationSchema = z.enum(['proceed', 'caution', 'stop']);

export const InterventionRequestSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(['food', 'transport', 'shopping', 'entertainment', 'utilities', 'other']),
  description: z.string().optional(),
  monthly_budget: z.number().positive(),
  monthly_spending: z.number().nonnegative(),
  recent_expenses: z.array(
    z.object({
      amount: z.number().positive(),
      category: z.string(),
      description: z.string().optional(),
      date: z.string().datetime({ offset: true }),
    })
  ).optional().default([]),
});

export type InterventionRequest = z.infer<typeof InterventionRequestSchema>;

export const InterventionResponseSchema = z.object({
  severity: SeveritySchema,
  message: z.string(),
  recommendation: RecommendationSchema,
  pattern: z.string().nullable().optional(),
  budget_after: z.string().optional(),
  source: z.enum(['gemma-3-27b', 'fallback']).optional(),
});

export type InterventionResponse = z.infer<typeof InterventionResponseSchema>;

// ============ INSIGHTS SCHEMAS ============
export const InsightsRequestSchema = z.object({
  monthly_income: z.number().positive(),
  monthly_budget: z.number().positive(),
  month_total: z.number().nonnegative(),
  category_breakdown: z.record(z.number()).optional(),
  days_elapsed: z.number().positive(),
  days_in_month: z.number().positive(),
  savings_goal: z.string(),
  savings_target: z.number().positive(),
  transaction_count: z.number().nonnegative(),
});

export type InsightsRequest = z.infer<typeof InsightsRequestSchema>;

export const InsightsResponseSchema = z.object({
  insights: z.array(z.string()),
  month_end_forecast: z.string(),
  savings_advice: z.string(),
  spending_health: z.enum(['excellent', 'good', 'fair', 'poor']),
  source: z.enum(['gemma-3-27b', 'fallback']).optional(),
});

export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;

// ============ API RESPONSE SCHEMAS ============
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ApiSuccessSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export type ApiSuccess = z.infer<typeof ApiSuccessSchema>;
