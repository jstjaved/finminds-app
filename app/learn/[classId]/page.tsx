import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, Play, Sparkles } from "lucide-react";
import ClassQuiz from "@/components/ClassQuiz";
import ClassExercise from "@/components/ClassExercise";
import { extractYouTubeId } from "@/lib/youtube";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

export default async function ClassPage({ params }: { params: { classId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const classId = Number(params.classId);

  const [{ data: cls }, { data: questions }, { data: completion }] = await Promise.all([
    supabase.from("classes").select("*").eq("id", classId).single(),
    supabase.from("quiz_questions").select("*").eq("class_id", classId).order("sort_order"),
    supabase.from("class_completions").select("*").eq("class_id", classId).eq("profile_id", user!.id).maybeSingle(),
  ]);

  if (!cls) return <div className="p-6">Class not found.</div>;
  const youtubeId = extractYouTubeId(cls.video_url);

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-ink mb-4">
          <ChevronLeft size={16} /> Back to Academy
        </Link>
        <div className="flex items-center gap-2 mb-5">
          <h1 className="font-display font-extrabold text-2xl text-ink">{cls.title}</h1>
          {cls.is_milestone && <Sparkles size={18} className="text-gold" />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {youtubeId ? (
              <div className="rounded-2xl overflow-hidden aspect-video border border-line">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={cls.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-ink aspect-video flex items-center justify-center relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #14213D, #24356B)" }}>
                <div className="text-center text-white z-10">
                  <div className="w-14 h-14 rounded-full bg-white/15 grid place-items-center mx-auto mb-2">
                    <Play size={22} fill="white" />
                  </div>
                  <div className="text-xs opacity-70 px-6">No video linked yet — add one in Supabase: Table Editor → classes → video_url.</div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="font-display font-bold text-ink mb-2">Lesson summary</div>
              <p className="text-sm text-slate leading-relaxed">{cls.summary}</p>
            </div>

            {cls.exercise_prompt && cls.exercise_options && (
              <ClassExercise prompt={cls.exercise_prompt} options={cls.exercise_options as string[]} correctIndex={cls.exercise_correct_index ?? 0} />
            )}

            <ClassQuiz classId={cls.id} questions={questions || []} reward={cls.reward_coins} isMilestone={cls.is_milestone} alreadyDone={Boolean(completion)} />
          </div>

          <div className="card h-fit" style={{ background: "#14213D", color: "white", border: "none" }}>
            <div className="font-display font-bold mb-3">Key takeaways</div>
            <div className="space-y-3">
              {(cls.takeaways as string[]).map((t, i) => (
                <div key={i} className="text-sm opacity-90 leading-relaxed pb-3 border-b border-white/10 last:border-0 last:pb-0">{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
