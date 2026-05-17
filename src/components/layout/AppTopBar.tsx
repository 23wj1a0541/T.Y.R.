"use client";

import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getPageTitle } from "@/lib/navigation";

export function AppTopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <Button
        size="sm"
        className="bg-violet-600 text-white hover:bg-violet-700"
      >
        Upgrade to Pro
      </Button>
    </header>
  );
}
