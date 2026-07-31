import { createClient } from "@/lib/supabase/server";
import { formatCoins } from "@/lib/currency";
import { getSimulatedPrice } from "@/lib/priceSimulation";
import TopNav from "@/components/TopNav";
import AllocationChart from "@/components/AllocationChart";

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

  const rows = (holdings || []).map((h) => {
    const co = companies!.find((c) => c.id === h.company_id)!;
    const price = getSimulatedPrice(co);
    const value = price * h.qty;
    const cost = h.avg_price * h.qty;
    const pl = value - cost;
    return { ...h, co, price, value, pl, plPct: cost ? (pl / cost) * 100 : 0 };
  });

  const portfolioValue = rows.reduce((s, r) => s + r.value, 0);
  const totalPL = rows.reduce((s, r) => s + r.pl, 0);

  const bySector: Record<string, number> = {};
  rows.forEach((r) => { bySector[r.co.sector] = (bySector[r.co.sector] || 0) + r.value; });
  const allocation = Object.entries(bySector).map(([sector, value]) => ({ sector, value }));

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-xs font-semibold text-teal tracking-wide">ACTIVE PORTFOLIO</div>
        <h1 className="font-display font-extrabold text-2xl text-ink mt-1">Your Investment Journey</h1>
        <p className="text-sm text-slate mt-1">Investing is a marathon, not a sprint — keep focusing on companies you understand.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-6">
          <div className="card"><div className="text-xs text-slate">Total value</div><div className="font-mono font-bold text-xl text-ink mt-1">{formatCoins(portfolioValue)}</div></div>
          <div className="card"><div className="text-xs text-slate">Overall P/L</div><div className={`font-mono font-bold text-xl mt-1 ${totalPL >= 0 ? "text-tealDeep" : "text-coral"}`}>{totalPL >= 0 ? "+" : ""}{formatCoins(totalPL)}</div></div>
          <div className="card"><div className="text-xs text-slate">Cash balance</div><div className="font-mono font-bold text-xl text-ink mt-1">{formatCoins(profile!.wallet)}</div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {rows.length === 0 ? (
              <div className="card text-center py-10">
                <div className="text-3xl">🌱</div>
                <div className="text-sm text-slate mt-2">No shares yet — visit Companies to make your first investment.</div>
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <div className="font-display font-bold text-ink mb-3">Your Holdings</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate border-b border-line">
                      <th className="pb-2 font-medium">Company</th>
                      <th className="pb-2 font-medium">Shares</th>
                      <th className="pb-2 font-medium">Price</th>
                      <th className="pb-2 font-medium text-right">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.company_id} className="border-b border-line last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{r.co.logo}</span>
                            <span className="font-semibold text-ink">{r.co.name}</span>
                          </div>
                        </td>
                        <td className="py-3 font-mono">{r.qty}</td>
                        <td className="py-3 font-mono">{formatCoins(r.price)}</td>
                        <td className={`py-3 font-mono text-right font-semibold ${r.pl >= 0 ? "text-tealDeep" : "text-coral"}`}>
                          {r.pl >= 0 ? "+" : ""}{formatCoins(r.pl)} ({r.plPct.toFixed(1)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(transactions || []).length > 0 && (
              <div className="card">
                <div className="font-display font-bold text-ink mb-3">Recent transactions</div>
                {(transactions || []).map((t) => {
                  const co = companies!.find((c) => c.id === t.company_id)!;
                  return (
                    <div key={t.id} className="flex justify-between text-sm text-slate py-2 border-b border-line last:border-0">
                      <span>{co.logo} Bought {t.qty} {co.name}</span>
                      <span className="font-mono text-ink">-{formatCoins(t.qty * t.price)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {rows.length > 0 && (
            <div className="card h-fit">
              <div className="font-display font-bold text-ink mb-3">Asset Allocation</div>
              <AllocationChart allocation={allocation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
