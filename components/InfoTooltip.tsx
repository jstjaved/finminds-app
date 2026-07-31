"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label="What does this mean?"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate hover:text-teal align-middle"
      >
        <Info size={12} />
      </button>
      {open && (
        <span className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 text-[11px] leading-snug bg-ink text-white rounded-lg px-2.5 py-2 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}
