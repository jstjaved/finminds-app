# FinMinds MVP — desktop redesign (Milestone 1)

This pass rebuilds the app to match the new UI designs and spec: desktop-first
layout with a top nav (Dashboard / Academy / Companies / Simulator / Rewards),
and a fully-simulated **Indian-only** market (Finnhub/US tickers removed).

## Latest: migration_005 — sell shares + realistic prices

Run **`supabase/migration_005.sql`** after `migration_004.sql`. It:

- **Adds a sell flow.** There was no way to sell before — `sell_shares` is a
  new server-enforced function mirroring `buy_shares` (checks you actually
  hold enough shares, credits your wallet, records a `sell` transaction).
  The company page now has Buy/Sell tabs; each portfolio holding has a
  "Trade" link to get there. Selling doesn't award XP (buying does, +5) —
  deliberate, so the game doesn't reward churn/day-trading over holding.
- **Repriced all 30 companies to roughly today's real NSE prices** (e.g.
  Reliance ~₹1,300, TCS ~₹2,430, HDFC Bank ~₹750 — the old numbers were
  arbitrary placeholders left over from before the Indian-market pivot and
  were far too low for several stocks). These are approximate and will drift
  out of date over time since there's no live feed — worth refreshing
  periodically if exact accuracy matters, but at least now grounded in
  reality rather than made up.
- **Rescales any existing holdings' cost basis** proportionally to the price
  change, so nobody's P&L jumps purely from the repricing itself.

## Previous: migration_004 — reward bug fixes + demo data

Run `migration_004.sql` (before 005) if you haven't already. It fixes rewards
silently not applying, adds a login streak, and adds 9 demo students so the
Rewards page's Class/School leaderboards have something to show.

## What changed in the desktop redesign (earlier pass)

- **Desktop-first layout** — top nav bar (logo, nav links, coins chip, avatar)
  replaces the old mobile bottom-tab bar.
- **Auth kept as-is, restyled** — simple email + password, desktop split-screen.
- **Left sidebar omitted** per your call — top nav only.
- **Indian-only market, fully simulated** — Finnhub/US pricing removed
  entirely. 30 Indian companies with CEO, revenue model, P/E, P/B, ROCE,
  dividend yield, and market cap (illustrative, clearly labeled as such).

## How XP works right now

- +10 XP once per class completed (flat, regardless of quiz score)
- +5 XP per buy transaction (flat per trade, not scaled by amount)
- 0 XP for selling (by design) and 0 XP for the daily coin bonus (only coins)
- Levels: New Investor (0–24) → Curious Investor (25–59) → Growth Investor (60+)

## Running migrations, in order

Fresh project: `schema.sql` → `migration_002.sql` → `migration_003.sql` → `migration_004.sql` → `migration_005.sql`.
Already deployed: run whichever files you haven't run yet, in that order.

## Still to come (next milestones)

- **Simulator**: Watchlist screen (the `watchlist` table already exists and is
  RLS-secured — just needs a UI)
- **Dashboard**: Today's Mission, Economics News widgets
- **Rewards**: Daily Goals
- **Profile**: Certificates
- **PWA**: manifest exists but no service worker / offline support yet
- Real motion (Framer Motion is in the spec's stack but not wired in yet)
- Accessibility pass (WCAG AA) hasn't been explicitly audited yet

## Setup

```
cp .env.local.example .env.local   # fill in Supabase URL/anon key
npm install
npm run dev
```

Deploy: push to GitHub → import into Vercel (free tier) → add the two
`NEXT_PUBLIC_SUPABASE_*` env vars → Deploy.




