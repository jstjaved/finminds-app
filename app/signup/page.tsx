"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="h-full min-h-screen flex flex-col justify-center items-center p-7 text-white text-center"
      style={{ background: "linear-gradient(160deg, #14213D 0%, #1F3160 60%, #1F9E92 130%)" }}>
      <div className="text-5xl mb-1">🌱</div>
      <h1 className="font-display text-3xl mb-1">Join FinMinds</h1>
      <p className="opacity-80 text-sm mb-8">Create your student account</p>

      <form onSubmit={handleSignup} className="w-full space-y-3">
        <input
          required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-ink text-sm outline-none"
        />
        <input
          type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-ink text-sm outline-none"
        />
        <input
          type="password" required minLength={6} placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-ink text-sm outline-none"
        />
        {error && <div className="text-coral text-xs bg-white/10 rounded-lg py-2">{error}</div>}
        {notice && <div className="text-teal text-xs bg-white/10 rounded-lg py-2">{notice}</div>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-gold text-ink rounded-2xl py-3.5 font-display font-bold text-base shadow-lg disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="text-sm mt-6 opacity-85">
        Already have an account? <Link href="/login" className="underline font-semibold">Log in</Link>
      </div>
    </div>
  );
}
