"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

import { ScoreRing } from "@/components/ats-score/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSeverityStyles, SEVERITY_ORDER } from "@/lib/ats-score-ui";
import type { AtsIssue, AtsScoreResult } from "@/types/ats-score";
import { cn } from "@/lib/utils";

type AtsScoreResultsProps = {
  result: AtsScoreResult;
  hasJobDescription: boolean;
};

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value === null) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="shrink-0 tabular-nums font-semibold text-slate-900">
          {value}/100
        </span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

function IssueCard({ issue }: { issue: AtsIssue }) {
  const styles = getSeverityStyles(issue.severity);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", styles.dot)} />
        <div className="min-w-0 flex-1 space-y-2">
          <Badge className={cn("border-0", styles.badge)}>{issue.section}</Badge>
          <p className="text-sm text-slate-800">{issue.message}</p>
          <p className="text-sm italic text-slate-500">{issue.suggestion}</p>
        </div>
      </div>
    </div>
  );
}

export function AtsScoreResults({
  result,
  hasJobDescription,
}: AtsScoreResultsProps) {
  const [showAllIssues, setShowAllIssues] = useState(false);

  const sortedIssues = useMemo(
    () =>
      [...result.issues].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      ),
    [result.issues],
  );

  const visibleIssues = showAllIssues
    ? sortedIssues
    : sortedIssues.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ScoreRing score={result.overall_score} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {hasJobDescription && (
            <ScoreBar
              label="Keyword Match Score"
              value={result.keyword_match_score}
            />
          )}
          <ScoreBar label="Format & Structure Compliance" value={result.format_score} />
          <ScoreBar label="Content Completeness" value={result.completeness_score} />
          <ScoreBar
            label="Metric Quantification Density"
            value={result.quantification_score}
          />
          <ScoreBar
            label="Readability & Parsing Index"
            value={result.readability_score}
          />
        </CardContent>
      </Card>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="font-semibold text-amber-900">
          Fix These 3 Things to Add ~15 Points:
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-amber-950">
          {result.top_fixes.map((fix, index) => (
            <li key={`${index}-${fix.slice(0, 24)}`}>{fix}</li>
          ))}
        </ol>
      </div>

      {(result.missing_keywords.length > 0 || result.found_keywords.length > 0) &&
        hasJobDescription && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keyword Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.found_keywords.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Found Keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.found_keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        className="border-0 bg-emerald-100 text-emerald-700"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {result.missing_keywords.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Missing Keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="outline"
                        className="border-red-200 bg-red-50 text-red-700"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 lg:col-span-7">
          <h3 className="text-base font-semibold text-slate-900">Issues Found</h3>
          {sortedIssues.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-slate-500">
                No major issues detected. Great work!
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {visibleIssues.map((issue, index) => (
                  <IssueCard key={`${issue.section}-${index}`} issue={issue} />
                ))}
              </div>
              {sortedIssues.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllIssues((prev) => !prev)}
                  className="w-full"
                >
                  {showAllIssues ? (
                    <>
                      <ChevronUp className="size-4" />
                      Show Fewer Issues
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4" />
                      Show All Issues ({sortedIssues.length})
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        <div className="col-span-12 lg:col-span-5">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Strengths</h3>
          <Card className="h-full border-emerald-100 bg-emerald-50/40">
            <CardContent className="space-y-3 p-5">
              {result.strengths.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No strengths highlighted yet. Tailor your resume to improve alignment.
                </p>
              ) : (
                result.strengths.map((strength) => (
                  <div key={strength} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <p className="text-sm text-slate-700">{strength}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
        <CardContent className="flex flex-col items-center justify-between gap-4 py-8 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-semibold text-slate-900">
              Want us to optimize these sections automatically?
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Tailor your resume to this job with Groq AI in one click.
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 bg-violet-600 hover:bg-violet-700"
          >
            <Link href="/app/tailor">
              Tailor Your Resume with AI
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
