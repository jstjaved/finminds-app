# FinMinds MVP — desktop redesign (Milestone 1)

This pass rebuilds the app to match the new UI designs and spec: desktop-first
layout with a top nav (Dashboard / Academy / Companies / Simulator / Rewards),
and a fully-simulated **Indian-only** market (Finnhub/US tickers removed).

## Latest: migration_004 — bug fixes + demo data + engagement features

Run **`supabase/migration_004.sql`** after `migration_003.sql`. It:

- **Fixes rewards silently not applying.** `complete_class` and
  `claim_daily_bonus` now verify their update actually touched a row and
  raise a clear error if not, instead of quietly doing nothing. Also
  re-grants EXECUTE on all three reward/trade functions to `authenticated`
  (a common Supabase gotcha — RPC calls need this explicitly in some setups).
  If you still see rewards not landing after this, the app will now show a
  real error message — send me the exact text and we can pin it down for good.
- **Adds a `streak` column** and increments it in `claim_daily_bonus`, powering
  the new streak badge/counter.
- **Adds 9 demo students** (5 in Grade 4, 4 in a new Grade 5) so the Rewards
  page's Class and School leaderboards have something to show. These aren't
  real signups — `profiles.is_demo` flags them, and the foreign key to
  `auth.users` was dropped for this table to allow it (a reasonable demo
  tradeoff; real signups are unaffected, they still go through the normal
  trigger).

Also in this pass (frontend-only, no migration needed):
- **Prices now actually move** (`lib/priceSimulation.ts`) — a deterministic
  day-by-day simulation, same for every user on a given day. This fixes flat
  P&L and makes company pages/trend charts feel alive instead of static.
- **Dashboard**: streak counter, recent quiz results, and a rotating
  "Recommended for you" company card.
- **Info tooltips** (ⓘ) on P/E, P/B, ROCE, Dividend Yield explaining each term.
- **Badges** restyled as playful circular medallions instead of plain cards.
- **Rewards page** now shows Class ranking and School ranking side by side.

## What changed in the desktop redesign (previous pass)

- **Desktop-first layout** — top nav bar (logo, nav links, coins chip, avatar)
  replaces the old mobile bottom-tab bar. Every page now uses a centered
  `max-w-7xl` desktop container instead of a phone-frame shell.
- **Auth kept as-is, restyled** — still simple email + password, presented as
  a desktop split-screen matching the reference designs.
- **Left sidebar omitted** per your call — top nav only.
- **Indian-only market, fully simulated** — Finnhub/US pricing removed
  entirely. 30 Indian companies with CEO, revenue model, P/E, P/B, ROCE,
  dividend yield, and market cap (illustrative, clearly labeled as such).

## Running migrations, in order

Fresh project: `schema.sql` → `migration_002.sql` → `migration_003.sql` → `migration_004.sql`.
Already deployed: just run whichever migration files you haven't run yet, in order.

## Still to come (next milestones)

- **Simulator**: Watchlist screen (the `watchlist` table already exists and is
  RLS-secured — just needs a UI)
- **Dashboard**: Today's Mission, Economics News widgets
- **Rewards**: Daily Goals
- **Profile**: Certificates
- **PWA**: manifest exists but no service worker / offline support yet
- Real motion (Framer Motion is in the spec's stack but not wired in yet —
  hover lift, count-up numbers, buy-confirmation confetti)
- Accessibility pass (WCAG AA) hasn't been explicitly audited yet

## Setup

```
cp .env.local.example .env.local   # fill in Supabase URL/anon key
npm install
npm run dev
```

Deploy: push to GitHub → import into Vercel (free tier) → add the two
`NEXT_PUBLIC_SUPABASE_*` env vars → Deploy.



