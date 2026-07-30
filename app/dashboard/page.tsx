import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoins } from "@/lib/currency";
import TopNav from "@/components/TopNav";
import { Play, TrendingUp, Award, Gift, Flame } from "lucide-react";

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

  let portfolioValue = 0;
  let totalPL = 0;
  (holdings || []).forEach((h) => {
    const co = companies?.find((c) => c.id === h.company_id);
    if (!co) return;
    portfolioValue += co.base_price * h.qty;
    totalPL += (co.base_price - h.avg_price) * h.qty;
  });

  const lvl = profile!.investor_xp >= 60 ? "Growth Investor" : profile!.investor_xp >= 25 ? "Curious Investor" : "New Investor";
  const nextLevelXp = profile!.investor_xp >= 60 ? null : profile!.investor_xp >= 25 ? 60 : 25;

  return (
    <div className="min-h-screen blob-bg">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-slate">Welcome back,</div>
            <h1 className="font-display font-extrabold text-2xl text-ink">{profile!.name} {profile!.avatar}</h1>
          </div>
        </div>

        {dailyBonusGranted && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2.5 mb-5" style={{ background: "#FFF6E5", border: "1px solid #FBE1AE" }}>
            <Gift size={18} className="text-gold" />
            <div className="text-sm text-ink"><b>+₹500</b> daily sign-in bonus added to your wallet!</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {nextClass && (
              <Link href={`/learn/${nextClass.id}`} className="card flex items-center justify-between" style={{ background: "linear-gradient(120deg, #0F9D8C, #0B7A6C)", color: "white", border: "none" }}>
                <div>
                  <div className="text-xs opacity-85 font-semibold tracking-wide">CONTINUE LEARNING</div>
                  <div className="font-display font-bold text-xl mt-1">{nextClass.title}</div>
                  <div className="text-sm opacity-85 mt-1">+{formatCoins(nextClass.reward_coins)} on completion</div>
                </div>
                <div className="bg-white rounded-full w-12 h-12 grid place-items-center flex-shrink-0">
                  <Play size={18} className="text-tealDeep" fill="#0B7A6C" />
                </div>
              </Link>
            )}

            <div className="card">
              <div className="font-display font-bold text-ink mb-3">Portfolio snapshot</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-slate">Holdings</div>
                  <div className="font-mono font-bold text-lg text-ink">{(holdings || []).length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate">Value</div>
                  <div className="font-mono font-bold text-lg text-ink">{formatCoins(portfolioValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate">P/L</div>
                  <div className={`font-mono font-bold text-lg ${totalPL >= 0 ? "text-tealDeep" : "text-coral"}`}>{totalPL >= 0 ? "+" : ""}{formatCoins(totalPL)}</div>
                </div>
              </div>
              {(!holdings || holdings.length === 0) && (
                <div className="text-xs text-slate mt-3 text-center">No shares yet — finish a class, then visit Companies.</div>
              )}
            </div>

            <div className="card">
              <div className="flex justify-between items-center mb-2">
                <div className="font-display font-bold text-ink">Learning progress</div>
                <span className="text-xs font-semibold text-slate">{completedIds.size}/{classes?.length || 0} classes</span>
              </div>
              <div className="h-2.5 bg-line rounded-full overflow-hidden">
                <div className="h-full bg-teal rounded-full" style={{ width: `${(completedIds.size / (classes?.length || 1)) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card" style={{ background: "#14213D", color: "white", border: "none" }}>
              <div className="text-xs opacity-70">Investor Level</div>
              <div className="font-display font-bold text-lg mt-0.5">{lvl}</div>
              <div className="text-xs opacity-70 mt-1">{profile!.investor_xp} XP{nextLevelXp ? ` · ${nextLevelXp - profile!.investor_xp} to next level` : " · max level"}</div>
            </div>

            <Link href="/market" className="card flex items-center gap-3 hover:border-teal transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cream grid place-items-center flex-shrink-0"><TrendingUp size={18} className="text-teal" /></div>
              <div>
                <div className="text-sm font-semibold text-ink">Explore Companies</div>
                <div className="text-xs text-slate">Buy your next share</div>
              </div>
            </Link>

            <Link href="/leaderboard" className="card flex items-center gap-3 hover:border-teal transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cream grid place-items-center flex-shrink-0"><Award size={18} className="text-gold" /></div>
              <div>
                <div className="text-sm font-semibold text-ink">Leaderboard</div>
                <div className="text-xs text-slate">See how your class ranks</div>
              </div>
            </Link>

            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream grid place-items-center flex-shrink-0"><Flame size={18} className="text-coral" /></div>
              <div>
                <div className="text-sm font-semibold text-ink">Sign in daily</div>
                <div className="text-xs text-slate">+₹500 every day you visit</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
