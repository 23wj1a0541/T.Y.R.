"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { ScoreRing } from "@/components/ats-score/score-ring";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getOverallScoreMeta } from "@/lib/ats-score-ui";
import type { SkillsGapResult } from "@/types/skills-gap";
import { cn } from "@/lib/utils";

type SkillsGapDashboardProps = {
  data: SkillsGapResult;
};

export function SkillsGapDashboard({ data }: SkillsGapDashboardProps) {
  const [learningPlanOpen, setLearningPlanOpen] = useState(false);
  const matchMeta = getOverallScoreMeta(data.match_percentage);
  const strongAlignment = data.match_percentage >= 70;

  const matchedSkills = data.matched_skills ?? [];
  const missingCritical = data.missing_critical ?? [];
  const adjacentSkills = data.adjacent_skills ?? [];
  const quickWins = data.quick_wins ?? [];
  const learningPlan = data.learning_plan ?? [];

  return (
    <Card
      className={cn(
        "border-2 shadow-sm",
        strongAlignment
          ? "border-emerald-300/80 bg-gradient-to-br from-emerald-50/40 to-white"
          : "border-violet-300/80",
      )}
    >
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-xl font-semibold text-slate-900">
          Skills Gap Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-start">
          <ScoreRing
            score={data.match_percentage}
            footerLabel="Semantic Skill Matrix Alignment"
          />
          <div className="max-w-md text-center lg:text-left">
            <p
              className={cn(
                "text-lg font-semibold",
                strongAlignment ? "text-emerald-800" : matchMeta.textClass,
              )}
            >
              {data.match_percentage}% role alignment
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Cross-reference of your tailored resume against the target job
              description — matched strengths, critical gaps, and bridge paths.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 rounded-xl border border-t-4 border-t-emerald-500 border-slate-200 bg-emerald-50/40 p-4 md:col-span-4">
            <h3 className="mb-3 text-sm font-semibold text-emerald-900">
              You Have ✓
            </h3>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length === 0 ? (
                <p className="text-xs text-slate-500">No direct matches listed.</p>
              ) : (
                matchedSkills.map((item, index) => (
                  <Badge
                    key={`${item.skill}-${index}`}
                    className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                  >
                    {item.skill}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="col-span-12 rounded-xl border border-t-4 border-t-rose-500 border-slate-200 bg-rose-50/40 p-4 md:col-span-4">
            <h3 className="mb-3 text-sm font-semibold text-rose-900">
              You&apos;re Missing ✗
            </h3>
            <TooltipProvider delayDuration={200}>
              <div className="flex flex-wrap gap-2">
                {missingCritical.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No critical gaps flagged.
                  </p>
                ) : (
                  missingCritical.map((item, index) => (
                    <Tooltip key={`${item.skill}-${index}`}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="destructive"
                          className="cursor-help border-rose-200 bg-rose-100 text-rose-900 hover:bg-rose-100"
                        >
                          {item.skill}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-xs text-left leading-relaxed"
                      >
                        {item.how_to_bridge ||
                          "Emphasize related experience to offset this gap."}
                      </TooltipContent>
                    </Tooltip>
                  ))
                )}
              </div>
            </TooltipProvider>
          </div>

          <div className="col-span-12 rounded-xl border border-t-4 border-t-indigo-500 border-slate-200 bg-indigo-50/40 p-4 md:col-span-4">
            <h3 className="mb-3 text-sm font-semibold text-indigo-900">
              Bridge Skills →
            </h3>
            <div className="space-y-4">
              {adjacentSkills.length === 0 ? (
                <p className="text-xs text-slate-500">No bridge paths listed.</p>
              ) : (
                adjacentSkills.map((item, index) => (
                  <div key={`${item.you_have}-${item.bridges_to}-${index}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-indigo-200 bg-indigo-100 text-indigo-900">
                        {item.you_have}
                      </Badge>
                      <span className="text-xs text-slate-400">→</span>
                      <Badge
                        variant="outline"
                        className="border-indigo-300 text-indigo-800"
                      >
                        {item.bridges_to}
                      </Badge>
                    </div>
                    {item.how ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {item.how}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {quickWins.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5">
            <h3 className="mb-3 text-sm font-semibold text-amber-950">
              ⚡ Immediate Resume Quick Wins:
            </h3>
            <ul className="list-inside list-disc space-y-2 text-sm text-amber-950/90">
              {quickWins.slice(0, 3).map((win, index) => (
                <li key={`${index}-${win.slice(0, 24)}`}>{win}</li>
              ))}
            </ul>
          </div>
        )}

        {learningPlan.length > 0 && (
          <Collapsible open={learningPlanOpen} onOpenChange={setLearningPlanOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100">
              <span>📚 Personal Technical Upskilling &amp; Learning Plan</span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-slate-500 transition-transform",
                  learningPlanOpen && "rotate-180",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                {learningPlan.map((item, index) => (
                  <li
                    key={`${item.skill}-${index}`}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold text-slate-900">{item.skill}</p>
                      <Badge variant="outline" className="font-normal">
                        {item.resource}
                      </Badge>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-slate-600">
                      {item.timeframe}
                    </p>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
