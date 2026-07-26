import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoins } from "@/lib/currency";
import NavBar from "@/components/NavBar";
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
    <div className="h-full min-h-screen pb-24">
      <div className="px-[18px] pt-[18px] pb-2.5">
        <h1 className="font-display text-xl text-ink">Learning Academy</h1>
      </div>
      <div className="px-[18px]">
        <div className="rounded-2xl border border-dashed border-line px-4 py-3 flex justify-between text-sm text-slate">
          <span>Grade 4 · Money Basics</span>
          <span className="font-bold text-ink">{completedIds.size}/{classes?.length || 0} done</span>
        </div>
      </div>

      <div className="px-6 pt-5 space-y-5">
        {(classes || []).map((c, i) => {
          const done = completedIds.has(c.id);
          const prevDone = i === 0 || completedIds.has(classes![i - 1].id);
          const locked = !prevDone;
          return (
            <Link
              key={c.id}
              href={locked ? "#" : `/learn/${c.id}`}
              className={`flex items-center gap-3 ${i % 2 === 1 ? "flex-row-reverse ml-auto" : ""} max-w-[80%] ${locked ? "pointer-events-none opacity-70" : ""}`}
              style={{ marginLeft: i % 2 === 1 ? "auto" : 0 }}
            >
              <div
                className="w-[52px] h-[52px] rounded-full flex-shrink-0 grid place-items-center"
                style={{ background: done ? "#FFB627" : locked ? "#E7EAF3" : "#2EC4B6" }}
              >
                {locked ? <Lock size={18} className="text-slate" /> : done ? <Check size={22} className="text-white" /> : <Play size={16} className="text-white" fill="white" />}
              </div>
              <div className="card py-2.5 px-3.5">
                <div className="text-sm font-bold text-ink font-display">{c.title}</div>
                <div className="text-[11px] text-slate mt-0.5 flex items-center gap-1.5">
                  +{formatCoins(c.reward_coins)} {c.is_milestone && <Sparkles size={11} className="text-gold" />}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <NavBar />
    </div>
  );
}
