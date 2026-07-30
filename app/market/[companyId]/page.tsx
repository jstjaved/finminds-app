import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoins } from "@/lib/currency";
import { ChevronLeft, ArrowUpRight, ArrowDownRight, Building2, Calendar, Lightbulb, User, Wallet } from "lucide-react";
import BuyForm from "@/components/BuyForm";
import PriceTrend from "@/components/PriceTrend";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

function StatCard({ label, value, tooltip }: { label: string; value: string; tooltip: string }) {
  return (
    <div className="card py-3" title={tooltip}>
      <div className="text-[10px] text-slate">{label}</div>
      <div className="font-mono font-bold text-ink mt-0.5">{value}</div>
    </div>
  );
}

export default async function CompanyPage({ params }: { params: { companyId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: c }, { data: profile }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", params.companyId).single(),
    supabase.from("profiles").select("wallet").eq("id", user!.id).single(),
  ]);
  if (!c) return <div className="p-6">Company not found.</div>;

  const price = c.base_price;
  const chg = c.base_chg;
  const up = chg >= 0;

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/market" className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-ink mb-4">
          <ChevronLeft size={16} /> Back to Companies
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-4">
              <div className="text-4xl w-16 h-16 rounded-2xl bg-cream grid place-items-center">{c.logo}</div>
              <div>
                <div className="font-display font-extrabold text-2xl text-ink">{c.name}</div>
                <div className="text-sm text-slate">{c.sector}</div>
              </div>
            </div>

            <div className="card">
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-xs text-slate">Current price</div>
                  <div className="font-mono text-2xl font-bold text-ink">{formatCoins(price)}</div>
                </div>
                <div className={`inline-flex items-center gap-0.5 text-sm font-bold px-2 py-1 rounded-lg ${up ? "text-tealDeep bg-[#E6F8F5]" : "text-coral bg-[#FFECEC]"}`}>
                  {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(chg)}%
                </div>
              </div>
              <div className="mt-4">
                <div className="text-[11px] text-slate mb-1">Recent trend (illustrative)</div>
                <PriceTrend price={price} chg={chg} up={up} />
              </div>
              <div className="flex gap-5 mt-3 text-xs text-slate">
                <div>52w High: <b className="text-ink">{formatCoins(c.high_52w)}</b></div>
                <div>52w Low: <b className="text-ink">{formatCoins(c.low_52w)}</b></div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate mb-2">Key stats (illustrative, for learning — not live financial data)</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {c.market_cap_cr != null && <StatCard label="MARKET CAP" value={`₹${c.market_cap_cr.toLocaleString("en-IN")} Cr`} tooltip="Total value of all the company's shares combined." />}
                {c.pe_ratio != null && <StatCard label="P/E RATIO" value={c.pe_ratio} tooltip="Price divided by earnings — a rough measure of how expensive a share is relative to profit." />}
                {c.pb_ratio != null && <StatCard label="P/B RATIO" value={c.pb_ratio} tooltip="Price divided by book value — compares share price to the company's net assets." />}
                {c.roce != null && <StatCard label="ROCE" value={`${c.roce}%`} tooltip="Return on Capital Employed — how efficiently a company uses its money to generate profit." />}
                {c.dividend_yield != null && <StatCard label="DIV. YIELD" value={`${c.dividend_yield}%`} tooltip="How much a company pays shareholders each year, as a % of the share price." />}
              </div>
            </div>

            {(c.ceo || c.revenue_model) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {c.ceo && (
                  <div className="card flex items-center gap-2.5">
                    <User size={16} className="text-slate flex-shrink-0" />
                    <div><div className="text-[10px] text-slate">Leadership</div><div className="text-xs font-bold text-ink">{c.ceo}</div></div>
                  </div>
                )}
                {c.revenue_model && (
                  <div className="card flex items-center gap-2.5">
                    <Wallet size={16} className="text-slate flex-shrink-0" />
                    <div><div className="text-[10px] text-slate">How it makes money</div><div className="text-xs font-bold text-ink">{c.revenue_model}</div></div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {c.founded_year && (
                <div className="card flex items-center gap-2.5">
                  <Calendar size={16} className="text-slate flex-shrink-0" />
                  <div><div className="text-[10px] text-slate">Founded</div><div className="text-xs font-bold text-ink">{c.founded_year}</div></div>
                </div>
              )}
              {c.headquarters && (
                <div className="card flex items-center gap-2.5">
                  <Building2 size={16} className="text-slate flex-shrink-0" />
                  <div><div className="text-[10px] text-slate">Headquarters</div><div className="text-xs font-bold text-ink">{c.headquarters}</div></div>
                </div>
              )}
            </div>

            {c.industry_description && (
              <div className="card">
                <div className="font-display font-bold text-ink mb-1.5">Industry</div>
                <p className="text-sm text-slate leading-relaxed">{c.industry_description}</p>
              </div>
            )}

            <div className="card">
              <div className="font-display font-bold text-ink mb-1.5">The story</div>
              <p className="text-sm text-slate leading-relaxed">{c.story}</p>
            </div>

            {c.fun_fact && (
              <div className="card flex items-start gap-2.5" style={{ background: "#FFF6E5", border: "1px solid #FBE1AE" }}>
                <Lightbulb size={16} className="text-gold flex-shrink-0 mt-0.5" />
                <div className="text-sm text-ink"><b>Did you know?</b> {c.fun_fact}</div>
              </div>
            )}

            <div>
              <div className="font-display font-bold text-ink mb-2">Known for</div>
              <div className="flex gap-2 flex-wrap">
                {(c.products as string[]).map((p) => (
                  <span key={p} className="bg-white border border-line rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink">{p}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-20 h-fit">
            <div className="card">
              <div className="font-display font-bold text-ink mb-1">Buy shares</div>
              <BuyForm companyId={c.id} price={price} wallet={profile!.wallet} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

