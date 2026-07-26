import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("grade_id").eq("id", user!.id).single();

  const { data: rows } = await supabase
    .from("profiles")
    .select("id, name, avatar, investor_xp, wallet")
    .eq("grade_id", me?.grade_id ?? 1)
    .order("investor_xp", { ascending: false })
    .limit(50);

  return (
    <div className="h-full min-h-screen pb-24">
      <div className="px-[18px] pt-[18px] pb-2.5 flex items-center gap-2">
        <Trophy size={20} className="text-gold" />
        <h1 className="font-display text-xl text-ink">Class Leaderboard</h1>
      </div>
      <div className="px-[18px] space-y-2">
        {(rows || []).map((r, i) => (
          <div key={r.id} className={`card flex items-center justify-between py-3 px-3.5 ${r.id === user!.id ? "border-2 border-teal" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="w-7 text-center font-mono font-bold text-slate">{i + 1}</div>
              <div className="text-xl">{r.avatar}</div>
              <div className="text-sm font-bold text-ink">{r.name}{r.id === user!.id ? " (you)" : ""}</div>
            </div>
            <div className="font-mono font-bold text-ink">{r.investor_xp} XP</div>
          </div>
        ))}
        {(!rows || rows.length === 0) && <div className="text-sm text-slate text-center mt-6">No classmates yet — invite them to sign up!</div>}
      </div>
      <NavBar />
    </div>
  );
}
