-- =====================================================
-- FINGUARD - Supabase Database Setup SQL
-- Complete schema with RLS policies and triggers
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Extended user information linked to Supabase Auth';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- =====================================================
-- 2. PROFILES TABLE (User financial profile)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income DECIMAL(12, 2) NOT NULL DEFAULT 50000,
  monthly_budget DECIMAL(12, 2) NOT NULL DEFAULT 30000,
  weekly_limit DECIMAL(12, 2) GENERATED ALWAYS AS (monthly_budget / 4) STORED,
  savings_goal VARCHAR(50) NOT NULL DEFAULT 'emergency',
  savings_target DECIMAL(12, 2) NOT NULL DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User financial profile and budget settings';
COMMENT ON COLUMN public.profiles.monthly_income IS 'User monthly income in rupees';
COMMENT ON COLUMN public.profiles.monthly_budget IS 'User monthly spending budget';
COMMENT ON COLUMN public.profiles.weekly_limit IS 'Auto-calculated weekly limit (budget / 4)';
COMMENT ON COLUMN public.profiles.savings_goal IS 'Primary savings goal (emergency, vacation, education, home, investment, other)';
COMMENT ON COLUMN public.profiles.savings_target IS 'Target amount to save for goal';

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- =====================================================
-- 3. EXPENSES TABLE (Individual transactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.expenses IS 'User expense transactions';
COMMENT ON COLUMN public.expenses.category IS 'Expense category (food, transport, shopping, entertainment, utilities, other)';
COMMENT ON COLUMN public.expenses.date IS 'Date when expense was incurred';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date DESC);

-- =====================================================
-- 4. AUDIT LOG TABLE (Track all changes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name VARCHAR(100) NOT NULL,
  action VARCHAR(10) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.audit_logs IS 'Audit trail of all database changes';

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Users table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Profiles table RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Expenses table RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Audit logs table RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE POLICIES - USERS TABLE
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own user record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own user record
CREATE POLICY "Users can update their own user record"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can manage users
CREATE POLICY "Service role can manage all users"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 7. CREATE POLICIES - PROFILES TABLE
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile (only once)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all profiles
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 8. CREATE POLICIES - EXPENSES TABLE
-- =====================================================

-- Users can view their own expenses
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own expenses
CREATE POLICY "Users can insert their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own expenses
CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own expenses
CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all expenses
CREATE POLICY "Service role can manage all expenses"
  ON public.expenses FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 9. CREATE POLICIES - AUDIT LOGS TABLE
-- =====================================================

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 10. TRIGGER FUNCTIONS FOR TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync users table with auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user data when auth.users is deleted
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. CREATE TRIGGERS
-- =====================================================

-- Update timestamp triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user record when new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Delete user record when auth user is deleted
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- =====================================================
-- 12. CREATE MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================

-- Monthly spending summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.monthly_spending_summary AS
SELECT
  e.user_id,
  DATE_TRUNC('month', e.date)::DATE AS month,
  SUM(e.amount) AS total_spent,
  COUNT(*) AS transaction_count,
  AVG(e.amount) AS avg_transaction,
  MAX(e.amount) AS max_transaction,
  MIN(e.amount) AS min_transaction,
  NOW() AS last_updated
FROM public.expenses e
GROUP BY e.user_id, DATE_TRUNC('month', e.date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_spending_summary 
  ON public.monthly_spending_summary (user_id, month);

-- Category breakdown view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.category_spending_summary AS
SELECT
  e.user_id,
  e.category,
  DATE_TRUNC('month', e.date)::DATE AS month,
  SUM(e.amount) AS total_spent,
  COUNT(*) AS transaction_count,
  AVG(e.amount) AS avg_transaction,
  NOW() AS last_updated
FROM public.expenses e
GROUP BY e.user_id, e.category, DATE_TRUNC('month', e.date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_category_spending_summary 
  ON public.category_spending_summary (user_id, category, month);

-- =====================================================
-- 13. GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Allow authenticated users to select from tables
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- Views
GRANT SELECT ON public.monthly_spending_summary TO authenticated;
GRANT SELECT ON public.category_spending_summary TO authenticated;

-- Service role full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 14. STORAGE BUCKETS (if you want to store receipts)
-- =====================================================

-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Receipt bucket RLS policy (users can only view their own)
CREATE POLICY "Users can view their own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'expense-receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'expense-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- 15. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- This will be populated by the app, but you can add test data if needed
-- DO NOT uncomment unless you're testing with demo accounts

/*
-- Test user (use real email)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Test profile
INSERT INTO public.profiles (user_id, monthly_income, monthly_budget, savings_goal, savings_target)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  50000,
  30000,
  'emergency',
  100000
) ON CONFLICT DO NOTHING;

-- Test expense
INSERT INTO public.expenses (user_id, amount, category, description, date)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  500,
  'food',
  'Lunch at Biryani House',
  NOW()
) ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- 16. USEFUL QUERIES FOR TROUBLESHOOTING
-- =====================================================

/*
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
ORDER BY schemaname, tablename;

-- Check user data
SELECT * FROM public.users;
SELECT * FROM public.profiles;
SELECT * FROM public.expenses;

-- Check auth users
SELECT id, email, created_at FROM auth.users;

-- Monthly spending for a user
SELECT * FROM public.monthly_spending_summary 
WHERE user_id = 'YOUR_USER_ID';

-- Refresh materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY public.monthly_spending_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.category_spending_summary;
*/

-- =====================================================
-- END OF SCHEMA SETUP
-- =====================================================
COMMIT;
