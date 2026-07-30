import { createClient } from "@/lib/supabase/server";
import { formatCoins } from "@/lib/currency";
import TopNav from "@/components/TopNav";
import ProfileEditor from "@/components/ProfileEditor";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: completions }, { data: holdings }, { data: classes }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("class_completions").select("class_id").eq("profile_id", user!.id),
    supabase.from("holdings").select("company_id").eq("profile_id", user!.id),
    supabase.from("classes").select("id"),
  ]);
  const { data: grade } = profile?.grade_id
    ? await supabase.from("grades").select("name").eq("id", profile.grade_id).single()
    : { data: null as { name: string } | null };

  const lvl = profile!.investor_xp >= 60 ? "Growth Investor" : profile!.investor_xp >= 25 ? "Curious Investor" : "New Investor";

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-display font-extrabold text-2xl text-ink mb-6">Profile</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ProfileEditor id={profile!.id} name={profile!.name} avatar={profile!.avatar} />

          <div className="card">
            <div className="font-display font-bold text-ink mb-3">Stats</div>
            <div className="divide-y divide-line">
              <div className="flex justify-between text-sm py-2"><span className="text-slate">Grade</span><span className="font-semibold text-ink">{grade?.name || "—"}</span></div>
              <div className="flex justify-between text-sm py-2"><span className="text-slate">Investor level</span><span className="font-semibold text-ink">{lvl}</span></div>
              <div className="flex justify-between text-sm py-2"><span className="text-slate">Classes completed</span><span className="font-mono font-bold text-ink">{(completions || []).length}/{classes?.length || 0}</span></div>
              <div className="flex justify-between text-sm py-2"><span className="text-slate">Coins in wallet</span><span className="font-mono font-bold text-ink">{formatCoins(profile!.wallet)}</span></div>
              <div className="flex justify-between text-sm py-2"><span className="text-slate">Companies owned</span><span className="font-mono font-bold text-ink">{(holdings || []).length}</span></div>
            </div>
          </div>
        </div>

        <div className="max-w-xs mt-5">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
