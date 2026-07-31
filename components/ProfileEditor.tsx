"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AVATARS = ["🧑\u200d🚀", "🧑\u200d🎓", "🦸", "🧑\u200d💻", "🧑\u200d🔬", "🥷"];

export default function ProfileEditor({ id, name, avatar }: { id: string; name: string; avatar: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [saving, setSaving] = useState(false);

  async function save(fields: Partial<{ name: string; avatar: string }>) {
    setSaving(true);
    await supabase.from("profiles").update(fields).eq("id", id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="card text-center">
      <div className="flex gap-2 justify-center mb-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            onClick={() => save({ avatar: a })}
            className={`text-xl w-10 h-10 rounded-xl border-2 ${a === avatar ? "border-teal bg-cloud" : "border-transparent"}`}
          >
            {a}
          </button>
        ))}
      </div>
      {editing ? (
        <div className="flex gap-1.5 justify-center mt-1">
          <input
            value={nameDraft} onChange={(e) => setNameDraft(e.target.value)}
            className="border border-line rounded-xl px-2.5 py-1.5 text-sm font-display text-center"
          />
          <button onClick={() => save({ name: nameDraft.trim() || name })} disabled={saving} className="bg-teal text-white rounded-xl px-3 py-1.5 text-xs font-bold">
            Save
          </button>
        </div>
      ) : (
        <div onClick={() => setEditing(true)} className="font-display text-lg text-ink mt-1 cursor-pointer inline-flex items-center gap-1.5">
          {name} <span className="text-slate text-xs">(edit)</span>
        </div>
      )}
    </div>
  );
}
