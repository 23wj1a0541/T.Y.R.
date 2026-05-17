"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function ScoreCard({
  label,
  score,
  variant,
  active,
}: {
  label: string;
  score: number;
  variant: "before" | "after";
  active: boolean;
}) {
  const isAfter = variant === "after";

  return (
    <Card
      className={cn(
        "border-2 transition-all duration-700",
        isAfter
          ? active
            ? "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-100"
            : "border-slate-200 bg-white"
          : active
            ? "border-amber-300 bg-amber-50"
            : "border-slate-200 bg-white",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={cn(
            "text-sm font-semibold uppercase tracking-wide",
            isAfter ? "text-emerald-800" : "text-amber-800",
          )}
        >
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-5xl font-bold tabular-nums",
            isAfter ? "text-emerald-600" : "text-amber-600",
          )}
        >
          {score}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {isAfter
            ? "ATS-optimized keywords, metrics, and structure"
            : "Generic phrasing · missing role keywords"}
        </p>
      </CardContent>
    </Card>
  );
}

export function AtsScoreDemo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayScore, setDisplayScore] = useState(58);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    const start = 58;
    const end = 91;
    const duration = 1400;
    const startTime = performance.now();

    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const value = Math.round(start + (end - start) * eased);
      setDisplayScore(value);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [hasAnimated]);

  return (
    <div ref={sectionRef} className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Watch your ATS score climb
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Tailor once — see measurable lift in keyword match and parser-friendly
          structure before you hit apply.
        </p>
      </div>

      <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <ScoreCard
          label="Before tailoring"
          score={58}
          variant="before"
          active={!hasAnimated || displayScore < 75}
        />

        <div className="flex flex-col items-center gap-2 text-violet-600">
          <ArrowRight className="hidden size-8 md:block" />
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
            AI Tailor
          </span>
        </div>

        <ScoreCard
          label="After tailoring"
          score={hasAnimated ? displayScore : 58}
          variant="after"
          active={hasAnimated && displayScore >= 75}
        />
      </div>
    </div>
  );
}
