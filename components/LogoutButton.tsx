"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  return (
    <button
      onClick={async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh(); }}
      className="w-full mt-3 bg-white border border-line text-coral rounded-2xl py-3 font-display font-bold text-sm"
    >
      Log out
    </button>
  );
}
