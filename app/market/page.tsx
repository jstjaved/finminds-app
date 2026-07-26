import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchQuotes } from "@/lib/finnhub";
import { formatCoins } from "@/lib/currency";
import NavBar from "@/components/NavBar";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const supabase = createClient();
  const { data: companies } = await supabase.from("companies").select("*").order("name");
  const tickers = (companies || []).filter((c) => c.real_ticker).map((c) => c.real_ticker as string);
  const { quotes, errors } = await fetchQuotes(tickers);
  const hasKey = Boolean(process.env.FINNHUB_API_KEY);

  return (
    <div className="h-full min-h-screen pb-24">
      <div className="px-[18px] pt-[18px] pb-2.5">
        <h1 className="font-display text-xl text-ink">Market</h1>
      </div>
      <div className="px-[18px]">
        {!hasKey ? (
          <div className="text-xs rounded-2xl px-3 py-2.5 mb-3" style={{ background: "#FFF6E5", color: "#7A5400", border: "1px solid #FFE1A8" }}>
            Add FINNHUB_API_KEY to your server env to enable live prices. Showing simulated prices for now.
          </div>
        ) : errors.length > 0 && tickers.length > 0 ? (
          <div className="text-xs rounded-2xl px-3 py-2.5 mb-3" style={{ background: "#E6F8F5", color: "#1F9E92", border: "1px solid #BEEDE7" }}>
            Live for {tickers.length - errors.length}/{tickers.length} tickers.
          </div>
        ) : null}

        <div className="space-y-2">
          {(companies || []).map((c) => {
            const live = c.real_ticker ? quotes[c.real_ticker] : null;
            const price = live ? live.price : c.base_price;
            const chg = live ? live.chg : c.base_chg;
            const up = chg >= 0;
            return (
              <Link key={c.id} href={`/market/${c.id}`} className="card flex items-center justify-between py-3 px-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl">{c.logo}</div>
                  <div>
                    <div className="text-sm font-bold text-ink flex items-center gap-1.5">
                      {c.name}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${live ? "bg-[#E6F8F5] text-tealDeep" : "bg-line text-slate"}`}>
                        {live ? "LIVE" : "SIM"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate">{c.sector}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-ink">{formatCoins(price)}</div>
                  <div className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-tealDeep" : "text-coral"}`}>
                    {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(chg)}%
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <NavBar />
    </div>
  );
}
