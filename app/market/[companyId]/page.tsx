import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchQuotes } from "@/lib/finnhub";
import { ChevronLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import BuyForm from "@/components/BuyForm";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ params }: { params: { companyId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: c }, { data: profile }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", params.companyId).single(),
    supabase.from("profiles").select("wallet").eq("id", user!.id).single(),
  ]);
  if (!c) return <div className="p-6">Company not found.</div>;

  const live = c.real_ticker ? (await fetchQuotes([c.real_ticker])).quotes[c.real_ticker] : null;
  const price = live ? live.price : c.base_price;
  const chg = live ? live.chg : c.base_chg;
  const up = chg >= 0;

  return (
    <div className="h-full min-h-screen pb-8">
      <div className="flex items-center gap-2 px-[18px] pt-[18px] pb-2.5">
        <Link href="/market" className="bg-white rounded-xl w-[34px] h-[34px] grid place-items-center shadow"><ChevronLeft size={18} /></Link>
        <h1 className="font-display text-xl text-ink">Company</h1>
      </div>
      <div className="px-[18px]">
        <div className="flex items-center gap-3">
          <div className="text-4xl w-[62px] h-[62px] rounded-2xl bg-cloud grid place-items-center">{c.logo}</div>
          <div>
            <div className="font-display text-xl text-ink flex items-center gap-2">
              {c.name}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${live ? "bg-[#E6F8F5] text-tealDeep" : "bg-line text-slate"}`}>{live ? "LIVE" : "SIM"}</span>
            </div>
            <div className="text-xs text-slate">{c.sector}</div>
          </div>
        </div>

        <div className="card mt-4">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-[11px] text-slate">Current price</div>
              <div className="font-mono text-2xl font-bold text-ink">{price} <span className="text-sm">coins</span></div>
            </div>
            <div className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${up ? "text-tealDeep bg-[#E6F8F5]" : "text-coral bg-[#FFECEC]"}`}>
              {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(chg)}%
            </div>
          </div>
          <div className="flex gap-5 mt-3 text-xs text-slate">
            <div>52w High: <b className="text-ink">{c.high_52w}</b></div>
            <div>52w Low: <b className="text-ink">{c.low_52w}</b></div>
          </div>
        </div>

        <div className="text-sm font-bold text-ink mt-4 mb-1.5">The story</div>
        <p className="text-[13px] text-slate leading-relaxed">{c.story}</p>

        <div className="text-sm font-bold text-ink mt-3.5 mb-2">Known for</div>
        <div className="flex gap-2 flex-wrap">
          {(c.products as string[]).map((p) => (
            <span key={p} className="bg-cloud rounded-full px-3 py-1.5 text-xs font-semibold text-ink">{p}</span>
          ))}
        </div>

        <BuyForm companyId={c.id} price={price} wallet={profile!.wallet} />
      </div>
    </div>
  );
}
