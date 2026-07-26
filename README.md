# FinMinds MVP — real backend build

A real, deployable version of the Learn → Earn → Invest app: Next.js frontend,
Supabase for auth + database + server-enforced rewards/trades, Finnhub for live
US stock prices. Everything below is free-tier, no credit card required.

## What's real here (vs. the earlier chat prototype)

- **Real accounts**: Supabase Auth (email + password). Each signup gets a row
  in `profiles` automatically (see the `handle_new_user` trigger in `supabase/schema.sql`).
- **Real backend**: Supabase Postgres + Row Level Security. Coins and shares are
  only ever changed through two Postgres functions (`complete_class`, `buy_shares`)
  that run server-side — a student can't grant themselves coins from devtools,
  because there's no direct write access to `wallet`/`investor_xp`/`holdings`.
- **Real market data**: `/api/market/quotes` and the server components call
  Finnhub server-to-server, so the API key never reaches the browser and there's
  no CORS issue. US-listed companies (Apple, Microsoft, Google, Amazon, Tesla,
  Nike, Disney, Netflix, Sony, Samsung) get live prices; the 20 NSE-listed Indian
  companies stay simulated because free open APIs don't cover NSE.
- **Real persistence**: everything lives in Postgres, not browser storage —
  works across devices, survives reloads, and is the foundation for real
  multi-student rollout.

## 1. Create your free Supabase project

1. Go to supabase.com → New project (free tier).
2. Once it's ready: **SQL Editor → New query** → paste the entire contents of
   `supabase/schema.sql` → Run. This creates every table, security policy,
   the two reward/trade functions, and seeds Grade 4 with its 4 classes,
   quizzes, and 30 companies.
3. **Settings → API** → copy the **Project URL** and **anon public key**.

## 2. Get a free Finnhub key

1. finnhub.io → sign up (free, no card) → Dashboard → copy your API key.

## 3. Configure environment variables

```
cp .env.local.example .env.local
```
Fill in the three values from steps 1–2.

## 4. Run locally

```
npm install
npm run dev
```
Open http://localhost:3000 — sign up, and you're in.

## 5. Add your lesson videos

In Supabase → Table Editor → `classes`, replace each `video_url`
(currently `REPLACE_WITH_YOUTUBE_ID_...`) with your real YouTube video IDs or URLs.

## 6. Deploy for free, accessible on mobile web

1. Push this project to a new GitHub repo (free).
2. Go to vercel.com → New Project → import that repo (free tier).
3. In Vercel's project settings → Environment Variables, add the same three
   variables from `.env.local`.
4. Deploy. Vercel gives you a real `https://your-app.vercel.app` URL —
   open it on any phone's browser, and (bonus) "Add to Home Screen" makes
   it behave like an app icon without needing an app store.

## Known MVP limitations, called out on purpose

- Leaderboard is scoped by grade only (no sections/classrooms yet) — easy to
  add a `section` column to `profiles` if you need per-classroom boards.
- NSE-listed companies are simulated, not live — real NSE data needs a paid
  provider (e.g. Twelve Data's paid plan) since free tiers don't cover it.
- `complete_class`/`buy_shares` are simple and readable on purpose for MVP —
  before a real multi-school rollout, add rate limiting and abuse monitoring
  on these RPCs (e.g. Supabase Edge Functions with additional checks).
