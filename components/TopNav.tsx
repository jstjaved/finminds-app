import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCoins } from "@/lib/currency";
import TopNavLinks from "@/components/TopNavLinks";
import { Coins } from "lucide-react";

export default async function TopNav() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("name, avatar, wallet, grade_id").eq("id", user!.id).single();
  const { data: grade } = profile?.grade_id
    ? await supabase.from("grades").select("name").eq("id", profile.grade_id).single()
    : { data: null };

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-line">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-teal grid place-items-center text-white text-sm">₹</span>
            FinMinds
          </Link>
          <TopNavLinks />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-cream border border-line rounded-full pl-2.5 pr-3.5 py-1.5">
            <Coins size={16} className="text-gold" />
            <span className="font-mono font-bold text-sm text-ink">{formatCoins(profile?.wallet ?? 0)}</span>
          </div>
          <Link href="/profile" className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-ink leading-tight">{profile?.name}</div>
              <div className="text-xs text-slate leading-tight">{grade?.name}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-cloud grid place-items-center text-lg">{profile?.avatar}</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
