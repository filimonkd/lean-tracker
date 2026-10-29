# Lean Tracker

A mobile-first calorie and macro tracker for a weight loss journey. It calculates a daily target from your profile, logs meals against it, and charts weight and intake over time.

## Features

- **Onboarding & plan**: Mifflin-St Jeor BMR × activity level (TDEE), minus a 500 kcal deficit (never below 1,500 kcal for men / 1,200 kcal for women). Macros: protein from goal weight, 25% fat, carbs for the rest. Targets can be overridden by hand.
- **Today**: a segmented calorie ring (one arc per meal), remaining calories, macro bars and meal cards. Switch between today and yesterday.
- **Log food**: search 30 seeded foods plus your own, add with a servings stepper, and delete entries. Custom foods can be created, edited and deleted; anything already logged keeps its original values.
- **Progress**: log daily weigh-ins, a weight trend chart (week / month / 3 / 6 months) and a 7-day calories-vs-goal chart, each with a table view.
- **Dark mode**: light, dark or auto, applied before first paint.

## Tech stack

Next.js 16 (App Router, Server Actions, Cache Components) · TypeScript · Prisma 6 + PostgreSQL (Supabase) · Tailwind CSS 4 · Recharts · Lucide icons

## Getting started

Requires Node.js 20.9+ and a Supabase project (the free tier is fine).

1. In Supabase, open your project → **Connect** (top bar) → **ORMs** → **Prisma** and copy the two connection strings.
2. Set up the app:

   ```bash
   npm install
   cp .env.example .env     # then paste your DATABASE_URL and DIRECT_URL into .env
   npm run db:deploy        # creates the tables
   npm run db:seed          # adds the 30 default foods
   npm run dev
   ```

Then open http://localhost:3000. The first visit takes you through onboarding.

## Deploying to Vercel

1. On vercel.com: **Add New → Project** and import this repository.
2. Under **Environment Variables**, add `DATABASE_URL` and `DIRECT_URL` (the same Supabase strings as in `.env`).
3. Deploy. The `vercel-build` script applies any pending migrations and the (idempotent) seed before building, so every push to `main` keeps the database in sync.
4. The app has no sign-in yet: turn on **Settings → Deployment Protection** so only you can open it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run db:deploy` | Apply pending migrations |
| `npm run db:migrate` | Create a new migration after editing `schema.prisma` |
| `npm run db:seed` | Add the default foods (safe to re-run) |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Project layout

```
prisma/            schema, migrations, seed (default foods)
src/app/           routes: / (today), /log, /history (progress), /settings (plan), /onboarding
src/components/    UI: dashboard, log, progress, sheets, theme
src/lib/actions.ts every database read and write (Server Actions)
src/lib/nutrition.ts  BMR / TDEE / target math
```

The app is single-user for now: every query is scoped to one user id (`src/lib/constants.ts`), so adding real accounts means swapping that id for the signed-in user's.
