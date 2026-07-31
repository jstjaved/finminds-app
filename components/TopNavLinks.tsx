"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learn", label: "Academy" },
  { href: "/market", label: "Companies" },
  { href: "/portfolio", label: "Simulator" },
  { href: "/leaderboard", label: "Rewards" },
];

export default function TopNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-6">
      {LINKS.map((l) => {
        const active = pathname?.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium pb-0.5 border-b-2 transition-colors ${
              active ? "text-ink border-teal font-semibold" : "text-slate border-transparent hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
