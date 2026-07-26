"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="h-full min-h-screen flex flex-col justify-center items-center p-7 text-white text-center"
      style={{ background: "linear-gradient(160deg, #14213D 0%, #1F3160 60%, #1F9E92 130%)" }}>
      <div className="text-5xl mb-1">🌱</div>
      <h1 className="font-display text-3xl mb-1">FinMinds</h1>
      <p className="opacity-80 text-sm mb-8 leading-relaxed">Learn how money grows.<br />Then grow some of your own.</p>

      <form onSubmit={handleLogin} className="w-full space-y-3">
        <input
          type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-ink text-sm outline-none"
        />
        <input
          type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-ink text-sm outline-none"
        />
        {error && <div className="text-coral text-xs bg-white/10 rounded-lg py-2">{error}</div>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-gold text-ink rounded-2xl py-3.5 font-display font-bold text-base shadow-lg disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>

      <div className="text-sm mt-6 opacity-85">
        New here? <Link href="/signup" className="underline font-semibold">Create an account</Link>
      </div>
    </div>
  );
}
