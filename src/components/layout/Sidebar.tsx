"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-slate-900 text-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold tracking-tight">
          TYR
        </div>
        <span className="text-sm font-semibold leading-tight text-white">
          Tailor Your Resume
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] shrink-0",
                  isActive ? "text-violet-400" : "text-slate-500",
                )}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-800 px-5 py-4">
        <p className="text-xs text-slate-500">Free Plan · 2/3 resumes used</p>
      </div>
    </aside>
  );
}
