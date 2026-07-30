"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setNotice("Check your email to confirm your account, then log in.");
    }
  }

  return (
    <div className="min-h-screen blob-bg grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center px-16">
        <div className="text-xs font-semibold text-teal tracking-wide">GETTING STARTED</div>
        <h1 className="font-display font-extrabold text-4xl text-ink mt-3 leading-tight">
          Your journey to <span className="text-teal">financial mastery</span> starts here.
        </h1>
        <p className="text-slate mt-4 max-w-md">
          Join thousands of students learning the essentials of money management — earn coins, own shares, and build real understanding.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-line p-8">
          <h2 className="font-display font-extrabold text-2xl text-ink">Join FinMinds</h2>
          <p className="text-sm text-slate mt-1 mb-6">Create your student account</p>

          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate">FULL NAME</label>
              <input
                required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate">EMAIL</label>
              <input
                type="email" required placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate">PASSWORD</label>
              <input
                type="password" required minLength={6} placeholder="min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-teal"
              />
            </div>
            {error && <div className="text-coral text-xs bg-[#FFECEC] rounded-lg py-2 px-3">{error}</div>}
            {notice && <div className="text-tealDeep text-xs bg-[#E6F8F5] rounded-lg py-2 px-3">{notice}</div>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-teal text-white rounded-xl py-3 font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? "Creating account..." : "Create account"} {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="text-sm mt-6 text-center text-slate">
            Already have an account? <Link href="/login" className="text-teal font-semibold">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
