import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoins } from "@/lib/currency";
import TopNav from "@/components/TopNav";
import { Check, Lock, Play, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: classes }, { data: completions }] = await Promise.all([
    supabase.from("classes").select("*").order("sort_order"),
    supabase.from("class_completions").select("class_id").eq("profile_id", user!.id),
  ]);
  const completedIds = new Set((completions || []).map((c) => c.class_id));

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-xs font-semibold text-teal tracking-wide">COURSE: MONEY BASICS</div>
            <h1 className="font-display font-extrabold text-2xl text-ink mt-1">Academy</h1>
          </div>
          <div className="text-sm font-semibold text-slate">{completedIds.size}/{classes?.length || 0} classes complete</div>
        </div>
        <div className="h-2 bg-line rounded-full overflow-hidden mt-4 mb-8 max-w-md">
          <div className="h-full bg-teal rounded-full" style={{ width: `${(completedIds.size / (classes?.length || 1)) * 100}%` }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(classes || []).map((c, i) => {
            const done = completedIds.has(c.id);
            const prevDone = i === 0 || completedIds.has(classes![i - 1].id);
            const locked = !prevDone;
            return (
              <Link
                key={c.id}
                href={locked ? "#" : `/learn/${c.id}`}
                className={`card flex flex-col gap-3 ${locked ? "pointer-events-none opacity-60" : "hover:border-teal transition-colors"}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-11 h-11 rounded-full grid place-items-center"
                    style={{ background: done ? "#F2A93B" : locked ? "#EAE6E2" : "#0F9D8C" }}
                  >
                    {locked ? <Lock size={16} className="text-slate" /> : done ? <Check size={19} className="text-white" /> : <Play size={14} className="text-white" fill="white" />}
                  </div>
                  <span className="text-xs font-semibold text-slate">Class {c.sort_order}</span>
                </div>
                <div>
                  <div className="font-display font-bold text-ink flex items-center gap-1.5">{c.title} {c.is_milestone && <Sparkles size={13} className="text-gold" />}</div>
                  <div className="text-xs text-slate mt-1">+{formatCoins(c.reward_coins)} on completion</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
