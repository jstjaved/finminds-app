"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen blob-bg grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center px-16">
        <div className="inline-flex items-center gap-1.5 bg-teal/10 text-teal text-xs font-semibold rounded-full px-3 py-1.5 w-fit">
          <Sparkles size={13} /> Adventure Awaits
        </div>
        <h1 className="font-display font-extrabold text-5xl text-ink mt-5 leading-tight">
          Master your money,<br /><span className="text-teal">unlock your future.</span>
        </h1>
        <p className="text-slate mt-4 max-w-md">
          Learn how companies work, earn coins, and practice investing safely — before it's real money.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-line p-8">
          <h2 className="font-display font-extrabold text-2xl text-ink">Welcome back!</h2>
          <p className="text-sm text-slate mt-1 mb-6">Ready to continue your financial journey?</p>

          <form onSubmit={handleLogin} className="space-y-3.5">
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
                type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-teal"
              />
            </div>
            {error && <div className="text-coral text-xs bg-[#FFECEC] rounded-lg py-2 px-3">{error}</div>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-teal text-white rounded-xl py-3 font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? "Signing in..." : "Continue to Academy"} {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="text-sm mt-6 text-center text-slate">
            New here? <Link href="/signup" className="text-teal font-semibold">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
