"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, TrendingUp, Wallet, User } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/market", label: "Market", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <div className="fixed sm:absolute bottom-0 left-1/2 -translate-x-1/2 w-full sm:w-[430px] bg-white border-t border-line flex px-1.5 pt-2 pb-3.5 rounded-t-none sm:rounded-b-[40px] z-10">
      {NAV.map((n) => {
        const active = pathname?.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 ${active ? "text-teal" : "text-slate"}`}
          >
            <Icon size={20} strokeWidth={active ? 2.6 : 2} />
            <span className={`text-[11px] ${active ? "font-bold" : "font-medium"}`}>{n.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
