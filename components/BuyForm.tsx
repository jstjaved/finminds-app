"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCoins } from "@/lib/currency";

export default function BuyForm({ companyId, price, wallet }: { companyId: string; price: number; wallet: number }) {
  const router = useRouter();
  const supabase = createClient();
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const cost = qty * price;
  const canAfford = cost <= wallet;

  async function confirm() {
    setSaving(true);
    setError("");
    const { error } = await supabase.rpc("buy_shares", { p_company_id: companyId, p_qty: qty, p_price: price });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
    router.refresh();
  }

  if (success) {
    return (
      <div className="mt-4 rounded-3xl p-7 text-center text-white" style={{ background: "linear-gradient(160deg, #2EC4B6, #1F9E92)" }}>
        <div className="text-5xl">🎊</div>
        <h2 className="font-display text-xl mt-2">You're an owner now!</h2>
        <p className="opacity-90 text-sm mt-1">Bought {qty} share{qty > 1 ? "s" : ""}.</p>
        <button onClick={() => router.push("/portfolio")} className="w-full mt-5 bg-white text-ink rounded-2xl py-3.5 font-display font-bold">
          View Portfolio →
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="text-sm font-bold text-ink">How many shares?</div>
      <div className="flex items-center justify-center gap-5 mt-3">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 rounded-full bg-cloud text-xl font-bold text-ink">−</button>
        <div className="font-mono text-3xl font-bold text-ink w-14 text-center">{qty}</div>
        <button onClick={() => setQty((q) => q + 1)} className="w-11 h-11 rounded-full bg-teal text-white text-xl font-bold">+</button>
      </div>
      <div className="card bg-cloud shadow-none mt-5 flex justify-between text-sm">
        <span className="text-slate">Estimated cost</span>
        <span className={`font-mono font-bold ${canAfford ? "text-ink" : "text-coral"}`}>{formatCoins(cost)}</span>
      </div>
      {!canAfford && <div className="text-coral text-xs text-center mt-2">Not enough coins — finish a lesson to earn more!</div>}
      {error && <div className="text-coral text-xs text-center mt-2">{error}</div>}
      <button
        onClick={confirm}
        disabled={!canAfford || saving}
        className="w-full mt-5 bg-ink text-white rounded-2xl py-3.5 font-display font-bold disabled:bg-line disabled:text-slate"
      >
        {saving ? "Buying..." : "Confirm Purchase"}
      </button>
    </div>
  );
}
