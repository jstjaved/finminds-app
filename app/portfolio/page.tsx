import { createClient } from "@/lib/supabase/server";
import { fetchQuotes } from "@/lib/finnhub";
import { formatCoins } from "@/lib/currency";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: holdings }, { data: companies }, { data: transactions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("holdings").select("*").eq("profile_id", user!.id),
    supabase.from("companies").select("*"),
    supabase.from("transactions").select("*").eq("profile_id", user!.id).order("created_at", { ascending: false }).limit(8),
  ]);

  const tickers = (companies || []).filter((c) => c.real_ticker).map((c) => c.real_ticker as string);
  const { quotes } = await fetchQuotes(tickers);

  const rows = (holdings || []).map((h) => {
    const co = companies!.find((c) => c.id === h.company_id)!;
    const live = co.real_ticker ? quotes[co.real_ticker] : null;
    const price = live ? live.price : co.base_price;
    const value = price * h.qty;
    const cost = h.avg_price * h.qty;
    const pl = value - cost;
    return { ...h, co, price, value, pl, plPct: cost ? (pl / cost) * 100 : 0 };
  });

  const portfolioValue = rows.reduce((s, r) => s + r.value, 0);
  const totalPL = rows.reduce((s, r) => s + r.pl, 0);

  return (
    <div className="h-full min-h-screen pb-24">
      <div className="px-[18px] pt-[18px] pb-2.5">
        <h1 className="font-display text-xl text-ink">Portfolio</h1>
      </div>
      <div className="px-[18px]">
        <div className="flex gap-2.5">
          <div className="card flex-1"><div className="text-[11px] text-slate">Total value</div><div className="font-mono font-bold text-ink">{formatCoins(portfolioValue)}</div></div>
          <div className="card flex-1"><div className="text-[11px] text-slate">Overall P/L</div><div className={`font-mono font-bold ${totalPL >= 0 ? "text-tealDeep" : "text-coral"}`}>{totalPL >= 0 ? "+" : ""}{formatCoins(totalPL)}</div></div>
          <div className="card flex-1"><div className="text-[11px] text-slate">Cash</div><div className="font-mono font-bold text-ink">{formatCoins(profile!.wallet)}</div></div>
        </div>

        {rows.length === 0 ? (
          <div className="card mt-3.5 text-center py-7">
            <div className="text-3xl">🌱</div>
            <div className="text-[13px] text-slate mt-1.5">No shares yet — visit the Market to plant your first investment.</div>
          </div>
        ) : (
          <>
            <div className="text-sm font-bold text-ink mt-4 mb-2">Holdings</div>
            {rows.map((r) => (
              <div key={r.company_id} className="card mb-2 py-3 px-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="text-xl">{r.co.logo}</div>
                  <div>
                    <div className="text-sm font-bold text-ink">{r.co.name}</div>
                    <div className="text-[11px] text-slate">{r.qty} shares · avg {formatCoins(r.avg_price)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-ink">{formatCoins(r.value)}</div>
                  <div className={`text-[11px] font-bold ${r.pl >= 0 ? "text-tealDeep" : "text-coral"}`}>{r.pl >= 0 ? "+" : ""}{formatCoins(r.pl)} ({r.plPct.toFixed(1)}%)</div>
                </div>
              </div>
            ))}

            <div className="text-sm font-bold text-ink mt-4 mb-2">Recent transactions</div>
            {(transactions || []).map((t) => {
              const co = companies!.find((c) => c.id === t.company_id)!;
              return (
                <div key={t.id} className="flex justify-between text-xs text-slate py-1.5 border-b border-line">
                  <span>{co.logo} Bought {t.qty} {co.name}</span>
                  <span className="font-mono">-{formatCoins(t.qty * t.price)}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
      <NavBar />
    </div>
  );
}
