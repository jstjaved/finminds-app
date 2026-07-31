"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCoins } from "@/lib/currency";

export default function TradeForm({
  companyId, price, wallet, ownedQty,
}: { companyId: string; price: number; wallet: number; ownedQty: number }) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"buy" | "sell" | null>(null);

  const amount = qty * price;
  const canBuy = amount <= wallet;
  const canSell = qty <= ownedQty;
  const valid = mode === "buy" ? canBuy : canSell;

  async function confirm() {
    setSaving(true);
    setError("");
    const fn = mode === "buy" ? "buy_shares" : "sell_shares";
    const { error } = await supabase.rpc(fn, { p_company_id: companyId, p_qty: qty, p_price: price });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setSuccess(mode);
    router.refresh();
  }

  if (success) {
    const isBuy = success === "buy";
    return (
      <div className="mt-4 rounded-3xl p-7 text-center text-white" style={{ background: isBuy ? "linear-gradient(160deg, #0F9D8C, #0B7A6C)" : "linear-gradient(160deg, #14213D, #24356B)" }}>
        <div className="text-5xl">{isBuy ? "🎊" : "💰"}</div>
        <h2 className="font-display font-bold text-xl mt-2">{isBuy ? "You're an owner now!" : "Shares sold"}</h2>
        <p className="opacity-90 text-sm mt-1">{isBuy ? `Bought ${qty} share${qty > 1 ? "s" : ""}.` : `Sold ${qty} share${qty > 1 ? "s" : ""} for ${formatCoins(amount)}.`}</p>
        <button onClick={() => router.push("/portfolio")} className="w-full mt-5 bg-white text-ink rounded-2xl py-3.5 font-display font-bold">
          View Simulator →
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex gap-1 bg-cream rounded-xl p-1 mb-4">
        <button
          onClick={() => { setMode("buy"); setQty(1); setError(""); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === "buy" ? "bg-white text-ink shadow-sm" : "text-slate"}`}
        >
          Buy
        </button>
        <button
          onClick={() => { setMode("sell"); setQty(1); setError(""); }}
          disabled={ownedQty === 0}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 ${mode === "sell" ? "bg-white text-ink shadow-sm" : "text-slate"}`}
        >
          Sell
        </button>
      </div>

      {mode === "sell" && ownedQty === 0 ? (
        <div className="text-xs text-slate text-center py-4">You don't own any shares of this company yet.</div>
      ) : (
        <>
          <div className="flex justify-between text-sm py-1.5">
            <span className="text-slate">{mode === "buy" ? "Wallet balance" : "You own"}</span>
            <span className="font-mono font-bold text-ink">{mode === "buy" ? formatCoins(wallet) : `${ownedQty} shares`}</span>
          </div>

          <div className="flex items-center justify-center gap-5 mt-4">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 rounded-full bg-cream text-xl font-bold text-ink">−</button>
            <div className="font-mono text-3xl font-bold text-ink w-16 text-center">{qty}</div>
            <button
              onClick={() => setQty((q) => (mode === "sell" ? Math.min(ownedQty, q + 1) : q + 1))}
              className="w-11 h-11 rounded-full bg-teal text-white text-xl font-bold"
            >
              +
            </button>
          </div>

          <div className="card bg-cream shadow-none mt-5 flex justify-between text-sm">
            <span className="text-slate">{mode === "buy" ? "Estimated cost" : "You'll receive"}</span>
            <span className={`font-mono font-bold ${valid ? "text-ink" : "text-coral"}`}>{formatCoins(amount)}</span>
          </div>
          {!valid && <div className="text-coral text-xs text-center mt-2">{mode === "buy" ? "Not enough coins — finish a class to earn more!" : "You don't own that many shares."}</div>}
          {error && <div className="text-coral text-xs text-center mt-2">{error}</div>}

          <button
            onClick={confirm}
            disabled={!valid || saving}
            className={`w-full mt-5 rounded-2xl py-3.5 font-display font-bold disabled:bg-line disabled:text-slate ${mode === "buy" ? "bg-ink text-white" : "bg-coral text-white"}`}
          >
            {saving ? "Processing..." : mode === "buy" ? "Confirm Purchase" : "Confirm Sale"}
          </button>
        </>
      )}
    </div>
  );
}
