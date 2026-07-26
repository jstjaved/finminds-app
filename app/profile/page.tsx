import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
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

  const lvl = profile!.investor_xp >= 60 ? "Growth Investor" : profile!.investor_xp >= 25 ? "Curious Investor" : "New Investor";
  const badges = [
    { name: "First Lesson", earned: (completions || []).length >= 1, icon: "📘" },
    { name: "Share Scholar", earned: (completions || []).some((c) => c.class_id === 4), icon: "🎓" },
    { name: "First Investment", earned: (holdings || []).length > 0, icon: "🌱" },
  ];

  return (
    <div className="h-full min-h-screen pb-24">
      <div className="px-[18px] pt-[18px] pb-2.5">
        <h1 className="font-display text-xl text-ink">Profile</h1>
      </div>
      <div className="px-[18px] space-y-3.5">
        <ProfileEditor id={profile!.id} name={profile!.name} avatar={profile!.avatar} />
        <div className="text-center text-xs text-slate">{lvl} · {profile!.investor_xp} XP</div>

        <div className="text-sm font-bold text-ink mt-2 mb-1.5">Badges</div>
        <div className="grid grid-cols-3 gap-2.5">
          {badges.map((b) => (
            <div key={b.name} className={`card text-center ${b.earned ? "" : "opacity-40"}`}>
              <div className="text-2xl">{b.icon}</div>
              <div className="text-[11px] font-semibold text-ink mt-1">{b.name}</div>
            </div>
          ))}
        </div>

        <div className="text-sm font-bold text-ink mt-2 mb-1.5">Stats</div>
        <div className="card divide-y divide-line">
          <div className="flex justify-between text-sm py-2"><span className="text-slate">Lessons completed</span><span className="font-mono font-bold text-ink">{(completions || []).length}/{classes?.length || 0}</span></div>
          <div className="flex justify-between text-sm py-2"><span className="text-slate">Coins in wallet</span><span className="font-mono font-bold text-ink">{profile!.wallet}</span></div>
          <div className="flex justify-between text-sm py-2"><span className="text-slate">Companies owned</span><span className="font-mono font-bold text-ink">{(holdings || []).length}</span></div>
        </div>

        <LogoutButton />
      </div>
      <NavBar />
    </div>
  );
}
