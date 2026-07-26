import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, Play } from "lucide-react";
import ClassQuiz from "@/components/ClassQuiz";
import ClassExercise from "@/components/ClassExercise";
import { extractYouTubeId } from "@/lib/youtube";

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
    <div className="h-full min-h-screen pb-8">
      <div className="flex items-center gap-2 px-[18px] pt-[18px] pb-2.5">
        <Link href="/learn" className="bg-white rounded-xl w-[34px] h-[34px] grid place-items-center shadow"><ChevronLeft size={18} /></Link>
        <h1 className="font-display text-xl text-ink">{cls.title}</h1>
      </div>

      <div className="px-[18px]">
        {youtubeId ? (
          <div className="rounded-2xl overflow-hidden aspect-video">
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
              <div className="w-[52px] h-[52px] rounded-full bg-white/15 grid place-items-center mx-auto mb-2">
                <Play size={22} fill="white" />
              </div>
              <div className="text-[11px] opacity-70 px-6">No video linked yet — add one in Supabase: Table Editor → classes → video_url.</div>
            </div>
          </div>
        )}

        <p className="text-sm text-slate leading-relaxed mt-3.5">{cls.summary}</p>

        <div className="text-sm font-bold text-ink mt-4 mb-2">Key takeaways</div>
        {(cls.takeaways as string[]).map((t, i) => (
          <div key={i} className="card mb-2 py-3 px-3.5 text-sm text-ink">{t}</div>
        ))}

        {cls.exercise_prompt && cls.exercise_options && (
          <ClassExercise prompt={cls.exercise_prompt} options={cls.exercise_options as string[]} correctIndex={cls.exercise_correct_index ?? 0} />
        )}

        <ClassQuiz classId={cls.id} questions={questions || []} reward={cls.reward_coins} isMilestone={cls.is_milestone} alreadyDone={Boolean(completion)} />
      </div>
    </div>
  );
}
