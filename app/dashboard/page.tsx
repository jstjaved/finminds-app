import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchQuotes } from "@/lib/finnhub";
import { formatCoins } from "@/lib/currency";
import NavBar from "@/components/NavBar";
import { Play, TrendingUp, Award, Wallet, Gift } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Daily sign-in bonus: server-enforced, pays out at most once per calendar day (IST).
  const { data: dailyBonusGranted } = await supabase.rpc("claim_daily_bonus");

  const [{ data: profile }, { data: classes }, { data: completions }, { data: holdings }, { data: companies }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("classes").select("*").order("sort_order"),
    supabase.from("class_completions").select("class_id").eq("profile_id", user!.id),
    supabase.from("holdings").select("*").eq("profile_id", user!.id),
    supabase.from("companies").select("*"),
  ]);

  const completedIds = new Set((completions || []).map((c) => c.class_id));
  const nextClass = (classes || []).find((c) => !completedIds.has(c.id)) || classes?.[classes.length - 1];

  const tickers = (companies || []).filter((c) => c.real_ticker).map((c) => c.real_ticker as string);
  const { quotes } = await fetchQuotes(tickers);

  let portfolioValue = 0;
  let todayPL = 0;
  (holdings || []).forEach((h) => {
    const co = companies?.find((c) => c.id === h.company_id);
    if (!co) return;
    const live = co.real_ticker ? quotes[co.real_ticker] : null;
    const price = live ? live.price : co.base_price;
    portfolioValue += price * h.qty;
    todayPL += (price - h.avg_price) * h.qty;
  });

  const lvl = profile!.investor_xp >= 60 ? "Growth Investor" : profile!.investor_xp >= 25 ? "Curious Investor" : "New Investor";

  return (
    <div className="h-full min-h-screen pb-24">
      <div className="bg-ink rounded-b-3xl px-5 pt-6 pb-7 text-white">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm opacity-70">Welcome back,</div>
            <div className="font-display text-xl">{profile!.name} {profile!.avatar}</div>
          </div>
          <div className="bg-white/10 rounded-2xl px-3 py-2 text-center">
            <div className="text-[10px] opacity-70">{lvl}</div>
            <div className="font-display text-base">{profile!.investor_xp} XP</div>
          </div>
        </div>
        <div className="flex gap-2.5 mt-4">
          <div className="flex-1 bg-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-xs opacity-75"><Wallet size={13} /> Wallet</div>
            <div className="font-mono text-lg font-bold mt-0.5">{formatCoins(profile!.wallet)}</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-xs opacity-75"><TrendingUp size={13} /> Portfolio</div>
            <div className="font-mono text-lg font-bold mt-0.5">{formatCoins(portfolioValue)}</div>
          </div>
        </div>
      </div>

      <div className="px-4.5 px-[18px] mt-4 space-y-3.5">
        {dailyBonusGranted && (
          <div className="rounded-2xl px-3.5 py-3 flex items-center gap-2.5" style={{ background: "#FFF6E5", border: "1px solid #FFE1A8" }}>
            <Gift size={18} className="text-gold" />
            <div className="text-sm text-ink"><b>+₹500</b> daily sign-in bonus added to your wallet!</div>
          </div>
        )}
        {/* Portfolio summary card */}
        <div className="card">
          <div className="text-sm font-bold text-ink mb-2">Portfolio summary</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[11px] text-slate">Holdings</div>
              <div className="font-mono font-bold text-ink">{(holdings || []).length}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate">Value</div>
              <div className="font-mono font-bold text-ink">{formatCoins(portfolioValue)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate">P/L</div>
              <div className={`font-mono font-bold ${todayPL >= 0 ? "text-tealDeep" : "text-coral"}`}>{todayPL >= 0 ? "+" : ""}{formatCoins(todayPL)}</div>
            </div>
          </div>
          {(!holdings || holdings.length === 0) && (
            <div className="text-[12px] text-slate mt-2 text-center">No shares yet — finish a lesson, then visit the Market.</div>
          )}
        </div>

        {nextClass && (
          <Link href={`/learn/${nextClass.id}`} className="card block" style={{ background: "linear-gradient(120deg, #2EC4B6, #1F9E92)", color: "white" }}>
            <div className="text-[11px] opacity-85 font-semibold tracking-wide">CONTINUE LEARNING</div>
            <div className="flex justify-between items-center mt-1.5">
              <div>
                <div className="font-display text-lg">{nextClass.title}</div>
                <div className="text-xs opacity-85 mt-0.5">+{formatCoins(nextClass.reward_coins)}</div>
              </div>
              <div className="bg-white rounded-full w-10 h-10 grid place-items-center">
                <Play size={16} className="text-tealDeep" fill="#1F9E92" />
              </div>
            </div>
          </Link>
        )}

        <div className="flex gap-3">
          <Link href="/market" className="card flex-1 text-center">
            <TrendingUp size={20} className="text-teal mx-auto" />
            <div className="text-xs font-semibold mt-1.5">Go Invest</div>
          </Link>
          <Link href="/leaderboard" className="card flex-1 text-center">
            <Award size={20} className="text-gold mx-auto" />
            <div className="text-xs font-semibold mt-1.5">Leaderboard</div>
          </Link>
        </div>

        <div className="card">
          <div className="flex justify-between text-sm text-slate">
            <span>Lessons completed</span><span className="text-ink font-bold">{completedIds.size}/{classes?.length || 0}</span>
          </div>
          <div className="h-2 bg-line rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-teal rounded-full" style={{ width: `${(completedIds.size / (classes?.length || 1)) * 100}%` }} />
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
}
