"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Coins } from "lucide-react";
import type { QuizQuestion } from "@/lib/types";
import { formatCoins } from "@/lib/currency";

export default function ClassQuiz({
  classId, questions, reward, isMilestone, alreadyDone,
}: { classId: number; questions: QuizQuestion[]; reward: number; isMilestone: boolean; alreadyDone: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (alreadyDone && !started) {
    return (
      <div className="mt-4 card text-center bg-cloud shadow-none border border-dashed border-line">
        <div className="text-sm text-slate">You already completed this class ✅</div>
        <button onClick={() => router.push("/learn")} className="mt-3 w-full bg-ink text-white rounded-2xl py-3 font-display font-bold">Back to Learn</button>
      </div>
    );
  }

  if (!started) {
    return (
      <button onClick={() => setStarted(true)} className="w-full mt-4.5 mt-[18px] bg-teal text-white rounded-2xl py-3.5 font-display font-bold text-base">
        Take the Quiz →
      </button>
    );
  }

  if (done) {
    return (
      <div className="mt-4 rounded-3xl p-7 text-center" style={{ background: isMilestone ? "linear-gradient(160deg, #FFB627, #FFD98C)" : "#F7F9FC" }}>
        <div className="text-5xl">{isMilestone ? "🎉" : "⭐"}</div>
        <h2 className="font-display text-xl text-ink mt-2">{isMilestone ? "Huge milestone!" : "Class complete!"}</h2>
        <div className="bg-white rounded-2xl px-6 py-4 mt-4 inline-block shadow">
          <div className="text-xs text-slate font-semibold">YOU EARNED</div>
          <div className="flex items-center gap-2 justify-center mt-1">
            <Coins className="text-gold" size={24} />
            <span className="font-mono text-2xl font-bold text-ink">+{formatCoins(reward)}</span>
          </div>
        </div>
        <button
          onClick={() => router.push(isMilestone ? "/market" : "/learn")}
          className="w-full mt-5 bg-ink text-white rounded-2xl py-3.5 font-display font-bold"
        >
          {isMilestone ? "Start Investing →" : "Continue Learning →"}
        </button>
      </div>
    );
  }

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  function choose(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correct_index) setScore((s) => s + 1);
  }

  async function next() {
    if (!isLast) { setIdx(idx + 1); setSelected(null); return; }
    setSaving(true);
    setError("");
    const { error } = await supabase.rpc("complete_class", { p_class_id: classId, p_score: score });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="h-2 bg-line rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gold rounded-full" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>
      <div className="text-xs text-slate font-semibold">Question {idx + 1} of {questions.length}</div>
      <div className="font-display text-lg text-ink my-2">{q.question}</div>

      {q.options.map((ans, i) => {
        let cls = "border-line bg-white";
        let icon = null;
        if (selected !== null) {
          if (i === q.correct_index) { cls = "border-teal bg-[#E6F8F5]"; icon = <CheckCircle2 size={18} className="text-tealDeep" />; }
          else if (i === selected) { cls = "border-coral bg-[#FFECEC]"; icon = <XCircle size={18} className="text-coral" />; }
        }
        return (
          <div
            key={i}
            onClick={() => choose(i)}
            className={`border-2 rounded-2xl px-3.5 py-3 mb-2.5 flex justify-between items-center text-sm text-ink font-medium cursor-pointer ${cls}`}
          >
            {ans}{icon}
          </div>
        );
      })}

      {error && <div className="text-coral text-xs mt-2">{error}</div>}

      {selected !== null && (
        <button onClick={next} disabled={saving} className="w-full mt-2 bg-ink text-white rounded-2xl py-3 font-display font-bold disabled:opacity-60">
          {saving ? "Saving..." : isLast ? "See Results →" : "Next Question →"}
        </button>
      )}
    </div>
  );
}
