import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoins } from "@/lib/currency";
import TopNav from "@/components/TopNav";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const supabase = createClient();
  const { data: companies } = await supabase.from("companies").select("*").order("name");
  const sectors = [...new Set((companies || []).map((c) => c.sector))];

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-xs font-semibold text-teal tracking-wide">MARKETPLACE</div>
        <h1 className="font-display font-extrabold text-2xl text-ink mt-1">Explore Companies</h1>
        <p className="text-sm text-slate mt-1 max-w-xl">Discover how India's biggest companies make money and grow — then decide if you'd like to own a piece.</p>

        <div className="flex gap-2 flex-wrap mt-5 mb-6">
          {sectors.map((s) => (
            <span key={s} className="text-xs font-semibold bg-white border border-line rounded-full px-3.5 py-1.5 text-slate">{s}</span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(companies || []).map((c) => {
            const up = c.base_chg >= 0;
            return (
              <Link key={c.id} href={`/market/${c.id}`} className="card hover:border-teal transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">{c.logo}</div>
                  <span className="text-xs font-semibold text-slate bg-cream rounded-full px-2.5 py-1">{c.sector}</span>
                </div>
                <div className="font-display font-bold text-ink">{c.name}</div>
                <div className="flex items-center justify-between mt-3">
                  <div className="font-mono font-bold text-ink">{formatCoins(c.base_price)}</div>
                  <div className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-tealDeep" : "text-coral"}`}>
                    {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(c.base_chg)}%
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
