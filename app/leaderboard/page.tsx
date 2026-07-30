import { createClient } from "@/lib/supabase/server";
import { formatCoins } from "@/lib/currency";
import TopNav from "@/components/TopNav";
import { Trophy, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function levelInfo(xp: number) {
  if (xp >= 60) return { name: "Growth Investor", next: null, floor: 60 };
  if (xp >= 25) return { name: "Curious Investor", next: 60, floor: 25 };
  return { name: "New Investor", next: 25, floor: 0 };
}

export default async function RewardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: completions }, { data: holdings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("class_completions").select("class_id").eq("profile_id", user!.id),
    supabase.from("holdings").select("company_id").eq("profile_id", user!.id),
  ]);

  const { data: rows } = await supabase
    .from("profiles")
    .select("id, name, avatar, investor_xp")
    .eq("grade_id", profile?.grade_id ?? 1)
    .order("investor_xp", { ascending: false })
    .limit(50);

  const lvl = levelInfo(profile!.investor_xp);
  const progressPct = lvl.next ? ((profile!.investor_xp - lvl.floor) / (lvl.next - lvl.floor)) * 100 : 100;

  const badges = [
    { name: "First Class", earned: (completions || []).length >= 1, icon: "📘" },
    { name: "Share Scholar", earned: (completions || []).some((c) => c.class_id === 4), icon: "🎓" },
    { name: "First Investment", earned: (holdings || []).length > 0, icon: "🌱" },
    { name: "Diversified", earned: (holdings || []).length >= 3, icon: "🧩" },
    { name: "All Classes Done", earned: (completions || []).length >= 10, icon: "🏆" },
    { name: "Daily Streak", earned: Boolean(profile!.last_daily_bonus_date), icon: "🔥" },
  ];

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-gold" />
          <h1 className="font-display font-extrabold text-2xl text-ink">Rewards</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="card" style={{ background: "#14213D", color: "white", border: "none" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-teal">{lvl.next ? "IN PROGRESS" : "MAX LEVEL"}</div>
                  <div className="font-display font-bold text-xl mt-0.5">{lvl.name}</div>
                </div>
                <TrendingUp size={22} className="text-teal" />
              </div>
              <div className="mt-4">
                <div className="text-sm opacity-80 mb-2">{profile!.investor_xp} XP{lvl.next ? ` · ${lvl.next - profile!.investor_xp} XP to next level` : ""}</div>
                <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full" style={{ width: `${Math.min(100, progressPct)}%` }} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="font-display font-bold text-ink mb-3">Badges</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((b) => (
                  <div key={b.name} className={`rounded-xl border border-line text-center py-4 ${b.earned ? "" : "opacity-35"}`}>
                    <div className="text-2xl">{b.icon}</div>
                    <div className="text-xs font-semibold text-ink mt-1.5">{b.name}</div>
                    {!b.earned && <div className="text-[10px] text-slate">Locked</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ background: "#FFF6E5", border: "1px solid #FBE1AE" }}>
            <div className="font-display font-bold text-ink mb-1">FinMinds Coins</div>
            <div className="font-mono font-bold text-2xl text-ink mt-1">{formatCoins(profile!.wallet)}</div>
            <div className="text-xs text-slate mt-1">Earn more by completing classes and signing in daily.</div>
          </div>
        </div>

        <div className="card mt-5">
          <div className="font-display font-bold text-ink mb-3">Class Ranking</div>
          <div className="space-y-2">
            {(rows || []).map((r, i) => (
              <div key={r.id} className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${r.id === user!.id ? "bg-[#E6F8F5]" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center font-mono font-bold text-slate text-sm">{i + 1}</div>
                  <div className="text-lg">{r.avatar}</div>
                  <div className="text-sm font-semibold text-ink">{r.name}{r.id === user!.id ? " (you)" : ""}</div>
                </div>
                <div className="font-mono font-bold text-ink text-sm">{r.investor_xp} XP</div>
              </div>
            ))}
            {(!rows || rows.length === 0) && <div className="text-sm text-slate text-center py-6">No classmates yet — invite them to sign up!</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
