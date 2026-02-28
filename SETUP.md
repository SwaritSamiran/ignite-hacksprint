# Finguard - Financial Guardian App

## Setup Guide

This guide will help you set up Finguard with Supabase, Gemma AI, and all necessary configurations.

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account (free at https://supabase.com)
- A Google AI API key (free at https://aistudio.google.com/apikey)

---

## 1. Environment Configuration

### Step 1: Create `.env.local`

Copy the template and fill in your credentials:

```bash
# .env.local

# Google AI (Gemma 3 27B)
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# App Configuration
NEXT_PUBLIC_APP_ENV=development
```

### Step 2: Get Google AI API Key

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key in new project"
3. Copy the generated API key
4. Paste it in `.env.local` as `NEXT_PUBLIC_GOOGLE_AI_API_KEY`

### Step 3: Set Up Supabase

#### Create Supabase Project

1. Go to https://supabase.com and sign up/log in
2. Click "New Project"
3. Fill in project details:
   - **Name**: `finguard` (or your choice)
   - **Database Password**: Store this safely
   - **Region**: Choose closest to your location
4. Wait for project to be created

#### Get Supabase Credentials

1. Go to Project Settings → API
2. Copy the following:
   - **Project URL** → Paste as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → Paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Paste as `SUPABASE_SERVICE_KEY`

#### Create Database Tables

Run these SQL queries in the Supabase SQL Editor:

```sql
-- Create users table (Supabase Auth handles this, but we need a profile)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income NUMERIC(10, 2) NOT NULL,
  monthly_budget NUMERIC(10, 2) NOT NULL,
  weekly_limit NUMERIC(10, 2) NOT NULL,
  savings_goal TEXT NOT NULL,
  savings_target NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 2. Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

---

## 3. Project Architecture

### Directory Structure

```
app/
├── layout.tsx              # Root layout with error boundary
├── page.tsx                # Home page
├── globals.css             # Global styles
├── api/
│   ├── intervention/route.ts    # Behavioral intervention endpoint
│   └── insights/route.ts        # Financial insights endpoint
├── auth/
│   ├── login/page.tsx      # Login page (Supabase auth)
│   └── signup/page.tsx     # Signup page (Supabase auth)
├── dashboard/
│   └── page.tsx            # Main dashboard
└── questionnaire/
    └── page.tsx            # Initial profile setup

components/
├── error-boundary.tsx      # Error boundary wrapper
├── dashboard-sidebar.tsx   # Dashboard sidebar with charts
└── gemma-character.tsx     # AI character component

lib/
├── ai-service.ts           # Gemma AI integration
├── config.ts               # App configuration
├── database.types.ts       # Database type definitions
├── schemas.ts              # Zod validation schemas
├── store.ts                # Zustand state stores
├── supabase.ts             # Supabase client setup
└── utils.ts                # Utility functions

hooks/
├── use-mobile.ts           # Mobile detection hook
└── use-toast.ts            # Toast notification hook
```

### Key Features Implementation

#### 1. Authentication (Supabase Auth)
- Secure user signup/login
- Password hashing (handled by Supabase)
- Session management via auth tokens
- Protected routes

#### 2. Type Safety (Zod)
- Runtime validation for all inputs
- API request/response validation
- Form validation
- Database type definitions

#### 3. State Management (Zustand)
- `useAuthStore` - User authentication state
- `useProfileStore` - User profile data
- `useExpensesStore` - Expense tracking
- `useInterventionStore` - AI intervention state
- `useUIStore` - UI state (theme, modals)

#### 4. AI Integration (Google Gemma)
- Behavioral interventions before purchases
- Monthly financial insights
- Fallback rule-based interventions
- Unique responses with random seeds

#### 5. Error Handling
- Error boundaries for crash recovery
- Zod validation for type safety
- API error responses with proper status codes
- User-friendly error messages

---

## 4. API Endpoints

### POST /api/intervention
Generates a behavioral intervention before purchase.

**Request:**
```json
{
  "amount": 500,
  "category": "food",
  "description": "Lunch",
  "monthly_budget": 30000,
  "monthly_spending": 15000,
  "recent_expenses": [...]
}
```

**Response:**
```json
{
  "severity": "low|medium|high|critical",
  "message": "Your intervention message",
  "recommendation": "proceed|caution|stop",
  "pattern": null,
  "budget_after": "52.5",
  "source": "gemma-3-27b"
}
```

### POST /api/insights
Generates monthly financial insights and analysis.

**Request:**
```json
{
  "monthly_income": 50000,
  "monthly_budget": 30000,
  "month_total": 15000,
  "category_breakdown": {...},
  "days_elapsed": 15,
  "days_in_month": 30,
  "savings_goal": "emergency",
  "savings_target": 100000,
  "transaction_count": 25
}
```

**Response:**
```json
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "month_end_forecast": "Your forecast...",
  "savings_advice": "Your savings advice...",
  "spending_health": "excellent|good|fair|poor",
  "source": "gemma-3-27b"
}
```

---

## 5. Development Workflow

### Add a New Page

1. Create file in `app/` directory
2. Make it a client component (`'use client'`)
3. Use Zustand stores for state
4. Wrap with ErrorBoundary if needed

### Add a New API Endpoint

1. Create route file in `app/api/`
2. Use Zod schemas for validation
3. Call `ai-service.ts` functions
4. Return proper error responses

### Update Database Schema

1. Run SQL in Supabase SQL Editor
2. Update types in `lib/database.types.ts`
3. Update schemas in `lib/schemas.ts`

---

## 6. Security Best Practices

### Implemented

- ✅ Supabase Auth for secure authentication
- ✅ Service key kept server-side only
- ✅ Row Level Security (RLS) policies
- ✅ Input validation with Zod
- ✅ Error boundaries to prevent data leaks
- ✅ HTTPS/TLS for all connections

### To Implement

- [ ] Rate limiting on API endpoints
- [ ] Request signing/verification
- [ ] Session expiration handling
- [ ] Audit logging
- [ ] Data encryption at rest

---

## 7. Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` has correct keys
- Restart dev server after updating `.env.local`

### "Authentication failed"
- Ensure Supabase project is active
- Check user credentials are correct
- Verify email is confirmed (if required)

### "Gemma API error"
- Check `NEXT_PUBLIC_GOOGLE_AI_API_KEY` is valid
- Ensure quota is not exceeded
- Check network connectivity

### "Type errors with Supabase"
- Run `npm run build` to validate TypeScript
- Check `lib/database.types.ts` matches your schema

---

## 8. Performance Optimization

### Implemented

- Zustand with localStorage persistence
- Zod schema reuse validation  
- Memoized API calls
- Lazy loading of charts/components

### To Implement

- [ ] Image optimization
- [ ] Code splitting
- [ ] Caching strategies
- [ ] Database query optimization
- [ ] CDN for static assets

---

## 9. Testing

Run tests:
```bash
npm run test
```

Add tests for:
- [ ] Schema validation
- [ ] AI service functions
- [ ] Utility functions
- [ ] Component rendering
- [ ] API endpoints

---

## 10. Deployment

### Deploy to Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to Other Platforms

1. Set environment variables
2. Run `npm run build`
3. Deploy the `.next` folder

---

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Google Gemma Docs: https://ai.google.dev/docs
- Next.js Docs: https://nextjs.org/docs
- Zod Docs: https://zod.dev
- Zustand Docs: https://github.com/pmndrs/zustand

---

## License

MIT License - See LICENSE file for details
