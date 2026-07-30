# FinMinds MVP — desktop redesign (Milestone 1)

This pass rebuilds the app to match the new UI designs and spec: desktop-first
layout with a top nav (Dashboard / Academy / Companies / Simulator / Rewards),
and a fully-simulated **Indian-only** market (Finnhub/US tickers removed).

## What changed in this milestone

- **Desktop-first layout** — top nav bar (logo, nav links, coins chip, avatar)
  replaces the old mobile bottom-tab bar. Every page now uses a centered
  `max-w-7xl` desktop container instead of a phone-frame shell.
- **Auth kept as-is, restyled** — still simple email + password (your call —
  the design's "Join Class" flow needs a teacher portal that's explicitly out
  of scope), now presented as a desktop split-screen matching the look of the
  reference designs.
- **Left sidebar omitted** — the "School Portal / Classmates / Settings" rail
  in the screenshots isn't in the written spec's module list, so per your
  choice it's left out. Top nav only.
- **Indian-only market, fully simulated** — per your decision, live Finnhub/US
  pricing is removed entirely (`lib/finnhub.ts` and the `/api/market/quotes`
  route are deleted). The 10 US companies are gone from the roster; 10 more
  Indian companies were added (SBI, Airtel, Kotak, Adani Enterprises, Coal
  India, ONGC, DMart, HCL Tech, Bajaj Finance, UltraTech) for 30 total.
- **Richer company data** — CEO, revenue model, P/E, P/B, ROCE, dividend
  yield, and market cap, matching the "Company Details" list in the spec.
  These are illustrative teaching numbers, not live financial data — labelled
  as such in the UI. CEO names are only shown where I was confident they're
  accurate and stable; left blank elsewhere rather than risk a wrong name.
- **Academy, Simulator, Rewards, Profile** rebuilt as desktop grids/cards
  matching the reference screenshots' structure (lesson cards, holdings table
  + allocation donut, rank card + badges + class ranking, profile + stats).

## Running the migration

Run **`supabase/migration_003.sql`** in your Supabase SQL Editor, after
`migration_002.sql`. It's additive/safe on your existing project: it adds the
new company columns, adds the 10 new companies, and only removes the 10 US
companies if no student has ever held/transacted/watchlisted them (so no
one's real portfolio history silently disappears).

Order for a fresh project: `schema.sql` → `migration_002.sql` → `migration_003.sql`.

## Still to come (next milestones, per the spec's own 8-milestone plan)

- **Simulator**: Watchlist screen (the `watchlist` table already exists and is
  RLS-secured — just needs a UI)
- **Dashboard**: Today's Mission, Learning Streak, Recommended Company,
  Economics News widgets (not built yet — didn't want to fill these with fake
  content just to look complete)
- **Rewards**: Daily Goals
- **Profile**: Certificates
- **PWA**: manifest exists but no service worker / offline support yet
  (would add `next-pwa` properly in a dedicated pass)
- Accessibility pass (WCAG AA) hasn't been explicitly audited yet

## Setup (unchanged)

```
cp .env.local.example .env.local   # fill in Supabase URL/anon key
npm install
npm run dev
```

Deploy: push to GitHub → import into Vercel (free tier) → add the two
`NEXT_PUBLIC_SUPABASE_*` env vars → Deploy. (No `FINNHUB_API_KEY` needed
anymore — the market is fully simulated now.)


