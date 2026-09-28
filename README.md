# Employee Meal Feedback & Mood Voting System

A modern web application for employees to submit mood feedback about daily meals, with an admin dashboard for viewing and exporting historical data.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Excel Export**: SheetJS (xlsx)
- **Timezone**: date-fns / date-fns-tz (Asia/Colombo)
- **Deployment**: Cloudflare Pages

## Quick Start

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Create an admin user in **Authentication > Users**

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & run

```bash
npm install
npm run dev
```

### 4. Access

- **Employee page**: http://localhost:5173/
- **Admin dashboard**: http://localhost:5173/admin

## Meal Periods (Asia/Colombo)

| Meal | Start | End |
|------|-------|-----|
| Breakfast | 7:00 AM | 10:30 AM |
| Lunch | 12:00 PM | 2:30 PM |
| Evening Snack | 5:00 PM | 7:00 PM |

## Database Schema

See `supabase-schema.sql` for the complete schema including:
- `meal_records` — Aggregate vote counts per meal per day
- `meal_votes` — Individual vote records
- `get_current_meal_status()` — RPC to get current meal period
- `submit_vote(p_mood)` — Atomic vote submission with validation
- Row Level Security policies

## Deployment to Cloudflare Pages

```bash
npm run build
```

Deploy the `dist/` folder to Cloudflare Pages. The `_redirects` file handles SPA routing.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Core business logic & config
├── pages/          # Page-level components
└── utils/          # Utility functions
```
