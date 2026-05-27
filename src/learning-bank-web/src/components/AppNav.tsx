"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";

interface NavProps {
  role: "Parent" | "Child";
  displayName: string;
  onSignOut: () => void;
}

export function AppNav({ role, displayName, onSignOut }: NavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const linkClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      isActive(href)
        ? "bg-[#9fe870] text-[#0e0f0c]"
        : "text-[#454745] hover:bg-[#e8ebe6] hover:text-[#0e0f0c]"
    }`;

  return (
    <header className="bg-white border-b border-[#e8ebe6] sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-black text-[#0e0f0c]">
          <Landmark className="w-5 h-5 text-[#9fe870]" aria-hidden />
          <span className="text-base font-black tracking-tight">Learning Bank</span>
        </Link>

        {/* Nav links */}
        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            <LayoutDashboard className="w-4 h-4" aria-hidden />
            Dashboard
          </Link>
          {role === "Parent" && (
            <>
              <Link href="/parent/children" className={linkClass("/parent/children")}>
                <Users className="w-4 h-4" aria-hidden />
                Children
              </Link>
              <Link href="/parent/categories" className={linkClass("/parent/categories")}>
                <Settings className="w-4 h-4" aria-hidden />
                Categories
              </Link>
            </>
          )}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#454745] hidden sm:block">{displayName}</span>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#454745] hover:text-[#0e0f0c] transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
