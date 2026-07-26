# FinMinds MVP — real backend build

A real, deployable version of the Learn → Earn → Invest app: Next.js frontend,
Supabase for auth + database + server-enforced rewards/trades, Finnhub for live
US stock prices. Everything below is free-tier, no credit card required.

## Reward economy (1 coin = ₹1, virtual)

- Signup bonus: **₹1,00,000**
- Completing a class (video + quiz): **₹10,000**
- Daily sign-in bonus: **₹500** (once per calendar day, IST)

## If you already deployed the earlier version

Run **`supabase/migration_002.sql`** in your Supabase SQL Editor (Project → SQL
Editor → New query → paste the whole file → Run). It's additive: it upgrades
your existing database in place — including a one-time top-up so your existing
test account gets its ₹1,00,000 too — without touching your existing account or
requiring a full reinstall. Do this once.

Then redeploy on Vercel (see "Fixing live prices" below — you likely need to do
this anyway) by re-uploading the changed files to your GitHub repo; Vercel
redeploys automatically on every push/upload.

## Fresh install

1. supabase.com → New project → SQL Editor → run `supabase/schema.sql`, then
   run `supabase/migration_002.sql` right after (same order, two files).
2. Continue with steps 2–6 below.

## 1. Get a free Finnhub key

finnhub.io → sign up (free, no card) → Dashboard → copy your API key.

## 2. Configure environment variables

```
cp .env.local.example .env.local
```
Fill in your Supabase URL/anon key and Finnhub key.

## 3. Run locally

```
npm install
npm run dev
```

## 4. Add your lesson videos

Supabase → **Table Editor** (left sidebar) → click the **`classes`** table →
find the row for each class → click into its **`video_url`** cell → paste
either a full YouTube link (`https://www.youtube.com/watch?v=...`) or just the
video ID → press Enter to save. The app now actually embeds and plays the
video (earlier versions just showed the link as text — that's fixed).

## 5. Deploy / redeploy for free

Push to GitHub → import into Vercel (free tier) → in **Project Settings →
Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `FINNHUB_API_KEY` → Deploy.

### Fixing live prices ("prices don't look real-time")

This is almost always one of these — check in order:

1. **Is `FINNHUB_API_KEY` actually set in Vercel** (not just your local
   `.env.local`)? Vercel Project → Settings → Environment Variables. Local env
   files never reach Vercel automatically.
2. **Did you redeploy after adding it?** Vercel only picks up new environment
   variables on the *next* deploy — adding the variable alone doesn't update
   an already-running deployment. Go to Deployments → "..." on the latest one
   → Redeploy.
3. Make sure the variable name has **no typos and no quotes** around the value
   in Vercel's UI (paste the raw key, nothing else).
4. Open `/market` on the live site — if it's still simulated, the yellow
   banner at the top will say so explicitly (rather than failing silently).

## Known MVP limitations, called out on purpose

- Only US-listed companies (Apple, Microsoft, Google, Amazon, Tesla, Nike,
  Disney, Netflix, Sony, Samsung) get live prices; the 20 NSE-listed Indian
  companies stay simulated — free open APIs don't cover NSE.
- Live USD prices are converted to INR using a fixed approximate rate in
  `lib/currency.ts` (not a live forex feed) — update that constant occasionally.
- The "recent trend" chart on a company's page is illustrative, not real
  historical data — free tiers don't reliably provide that; treat it as a
  teaching visual, not a real chart.
- Leaderboard is scoped by grade only (no sections/classrooms yet).
- `complete_class`/`buy_shares`/`claim_daily_bonus` are simple and readable on
  purpose for MVP — before a real multi-school rollout, add rate limiting and
  abuse monitoring on these RPCs.

