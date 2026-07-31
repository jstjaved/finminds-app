"use client";

import { useState } from "react";
import { CheckCircle2, Lightbulb } from "lucide-react";

export default function ClassExercise({
  prompt, options, correctIndex,
}: { prompt: string; options: string[]; correctIndex: number }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="mt-4">
      <div className="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
        <Lightbulb size={15} className="text-gold" /> Try it yourself
      </div>
      <div className="card">
        <div className="text-sm text-ink mb-3">{prompt}</div>
        {options.map((opt, i) => {
          let cls = "border-line bg-white";
          if (selected !== null && i === correctIndex) cls = "border-teal bg-[#E6F8F5]";
          else if (selected === i) cls = "border-line bg-cloud";
          return (
            <div
              key={i}
              onClick={() => setSelected(i)}
              className={`border-2 rounded-xl px-3 py-2.5 mb-2 text-sm text-ink cursor-pointer flex justify-between items-center ${cls}`}
            >
              {opt}
              {selected !== null && i === correctIndex && <CheckCircle2 size={16} className="text-tealDeep" />}
            </div>
          );
        })}
        {selected !== null && (
          <div className="text-xs text-slate mt-1">
            {selected === correctIndex ? "Nice thinking! " : "Worth a re-think — "}
            This one's just for practice, no coins here — the quiz below is where you earn your reward.
          </div>
        )}
      </div>
    </div>
  );
}
