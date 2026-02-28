# Finguard

**AI-powered behavioral intervention for smarter spending.**

Finguard is a personal finance application that uses Google's Gemma 3 27B language model to intervene in real-time before you confirm an expense. Instead of passively tracking where your money went, Finguard actively challenges impulsive spending by analyzing your budget state, category patterns, and spending velocity -- then delivers a personalized recommendation (proceed, caution, or stop) before the transaction is recorded.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Supabase Setup](#supabase-setup)
  - [Install and Run](#install-and-run)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [AI Integration](#ai-integration)
- [Theme System](#theme-system)

---

## How It Works

1. **Sign up** and complete a financial questionnaire (monthly income, spending budget, savings goal, savings target).
2. **Log an expense** on the dashboard. Before confirming, the app sends your spending context to Gemma 3 27B.
3. **Gemma intervenes** with a severity rating (low / medium / high / critical) and a recommendation (proceed / caution / stop), referencing your actual numbers -- budget remaining, category frequency, daily spending pace.
4. **You decide** whether to confirm or cancel the expense based on Gemma's advice.
5. **Track patterns** through the sidebar: category breakdowns (pie chart), 14-day spending trends (area chart), weekly comparisons (bar chart), time-of-day analysis, savings tracker, and AI-generated behavioral insights.

An animated character ("Gemma") on the dashboard reacts visually to your spending health -- green and happy under 70% budget usage, amber and warning near 85%, red and angry when you exceed your limit.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5.7.3 |
| UI | React 19.2.4, Tailwind CSS 4.2.0, Radix UI primitives |
| Charts | Recharts 2.15.0 |
| Auth + Database | Supabase (PostgreSQL with Row Level Security) |
| AI Model | Google Gemma 3 27B via Generative Language API |
| Validation | Zod 3.24.1 |
| State | Zustand 4.4.7 |

---

## Architecture

```
Browser (Client Components)
    |
    +-- Landing Page (/)
    +-- Auth (/auth/login, /auth/signup)
    +-- Questionnaire (/questionnaire)
    |       |
    |       +-- Upserts profile to Supabase [profiles] table
    |
    +-- Dashboard (/dashboard)
            |
            +-- Reads profile + expenses from Supabase
            +-- On "Log Expense":
            |       |
            |       +-- POST /api/intervention
            |       |       |
            |       |       +-- Zod validation
            |       |       +-- Gemma 3 27B API call
            |       |       +-- Returns severity + recommendation
            |       |
            |       +-- User confirms/cancels
            |       +-- INSERT into Supabase [expenses] table
            |
            +-- Sidebar
                    |
                    +-- Profile panel (reads/writes Supabase [profiles])
                    +-- Calendar panel (reads Supabase [expenses])
                    +-- Insights overlay
                            |
                            +-- POST /api/insights
                            +-- Recharts visualizations
```

All data flows through Supabase as the single source of truth. localStorage is only used for theme preference (`finguard_theme`) and the auth email bridge (`finguard_currentUser`).

---

## Database Schema

Four tables with Row Level Security enabled on all:

**users** -- extends Supabase `auth.users`

| Column | Type |
|--------|------|
| id | UUID (PK, FK to auth.users) |
| email | TEXT (unique) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

**profiles** -- financial settings per user

| Column | Type |
|--------|------|
| id | UUID (PK) |
| user_id | UUID (unique FK to auth.users) |
| monthly_income | DECIMAL(12,2) |
| monthly_budget | DECIMAL(12,2) |
| weekly_limit | DECIMAL(12,2) -- generated: budget / 4 |
| savings_goal | VARCHAR(50) |
| savings_target | DECIMAL(12,2) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

**expenses** -- individual transactions

| Column | Type |
|--------|------|
| id | UUID (PK) |
| user_id | UUID (FK to auth.users) |
| amount | DECIMAL(10,2) |
| category | VARCHAR(50) |
| description | TEXT |
| date | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

**audit_logs** -- change tracking

| Column | Type |
|--------|------|
| id | UUID (PK) |
| user_id | UUID (FK) |
| table_name | VARCHAR(100) |
| action | VARCHAR(10) |
| old_values | JSONB |
| new_values | JSONB |
| created_at | TIMESTAMPTZ |

Categories: `food`, `transport`, `shopping`, `entertainment`, `utilities`, `other`

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm)
- A Supabase project (free tier works)
- A Google AI API key with access to Gemma 3 27B

### Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your-google-ai-api-key
```

- `NEXT_PUBLIC_SUPABASE_URL` -- found in Supabase dashboard under Settings > API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- the `anon` / `public` key from the same page
- `SUPABASE_SERVICE_KEY` -- the `service_role` key (server-side only, never exposed to client)
- `NEXT_PUBLIC_GOOGLE_AI_API_KEY` -- from Google AI Studio (https://aistudio.google.com/apikey)

### Supabase Setup

1. Create a new project at https://supabase.com
2. Go to SQL Editor in the Supabase dashboard
3. Paste the contents of `sql/schema.sql` and run it -- this creates all tables, indexes, RLS policies, and triggers
4. In Authentication > Settings, disable "Require email confirmation" for development (or configure an SMTP provider)

### Install and Run

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
app/
  page.tsx                   Landing page
  layout.tsx                 Root layout (fonts, metadata, theme script, error boundary)
  globals.css                Tailwind v4 theme, CSS custom properties, animations
  auth/
    login/page.tsx           Email/password login with Zod validation
    signup/page.tsx          Account creation with password confirmation
  questionnaire/page.tsx     Post-signup financial profile setup (sliders + inputs)
  dashboard/page.tsx         Main app: expense logging, AI intervention modal, spending overview
  api/
    intervention/route.ts    POST -- AI behavioral intervention before expense confirmation
    insights/route.ts        POST -- AI-generated spending analysis and forecasts

components/
  dashboard-sidebar.tsx      Navigation, profile panel, calendar, insights overlay, charts
  gemma-character.tsx        Animated SVG mascot with 5 emotional states
  error-boundary.tsx         React error boundary wrapper

hooks/
  use-mobile.ts              Mobile viewport detection
  use-toast.ts               Toast notification hook

lib/
  supabase.ts                Client singleton + server-side Supabase client factory
  ai-service.ts              Gemma 3 27B integration (intervention + insights generation)
  schemas.ts                 All Zod schemas (auth, profile, expense, API request/response)

sql/
  schema.sql                 Complete PostgreSQL schema (tables, RLS, triggers, indexes)
```

---

## API Routes

### POST /api/intervention

Generates a behavioral intervention before an expense is confirmed.

**Request body:**
```json
{
  "amount": 500,
  "category": "food",
  "description": "coffee",
  "monthly_budget": 30000,
  "monthly_spending": 18000,
  "recent_expenses": [
    { "amount": 200, "category": "food", "description": "snacks", "date": "2026-02-28T10:00:00+00:00" }
  ]
}
```

**Response:**
```json
{
  "severity": "low",
  "message": "Rs.500 for coffee is fine -- you have Rs.12,000 left this month.",
  "recommendation": "proceed",
  "pattern": null,
  "budget_after": "63",
  "source": "gemma-3-27b"
}
```

### POST /api/insights

Generates AI-powered spending analysis.

**Request body:**
```json
{
  "monthly_income": 50000,
  "monthly_budget": 30000,
  "month_total": 18000,
  "category_breakdown": { "food": 8000, "transport": 5000, "shopping": 5000 },
  "days_elapsed": 15,
  "days_in_month": 28,
  "savings_goal": "emergency",
  "savings_target": 100000,
  "transaction_count": 25
}
```

**Response:**
```json
{
  "insights": ["Food is 44% of your spending...", "..."],
  "month_end_forecast": "Projected month-end: Rs.33,600",
  "savings_advice": "Cut dining out by 20% to save an extra Rs.1,600/month",
  "spending_health": "fair",
  "source": "gemma-3-27b"
}
```

Both routes fall back to rule-based logic if the Gemma API key is not configured or the API call fails.

---

## AI Integration

Finguard uses **Google Gemma 3 27B** (`gemma-3-27b-it`) via the Generative Language REST API.

**Intervention prompt design:**
- Receives the user's exact financial snapshot (budget, spending, remaining, category frequency, today's total)
- Responds with structured JSON: severity, message (2-3 sentences max), recommendation, and detected pattern
- Uses a random seed per request to ensure varied, non-repetitive responses
- Temperature: 0.85, topP: 0.9, topK: 30, max tokens: 500
- 15-second timeout with `AbortSignal.timeout()`

**Fallback system:** If the API is unavailable, a deterministic rule engine generates interventions based on budget percentage thresholds and category frequency.

---

## Theme System

Dark and light themes are implemented with CSS custom properties toggled via a `data-theme` attribute on `<html>`.

| Token | Dark | Light |
|-------|------|-------|
| Background | #0a0e14 | #f8fafc |
| Card | #111827 | #ffffff |
| Primary | #10b981 (emerald) | #059669 |
| Accent | #34d399 | #10b981 |
| Secondary | #fbbf24 (amber) | #f59e0b |
| Destructive | #ef4444 | #dc2626 |

An inline script in the root layout reads the theme from localStorage before the first paint, preventing flash-of-wrong-theme.

---

## License

This project was built for the Ignite Hacksprint.