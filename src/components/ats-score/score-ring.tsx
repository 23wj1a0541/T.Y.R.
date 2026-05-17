import { getOverallScoreMeta } from "@/lib/ats-score-ui";
import { cn } from "@/lib/utils";

type ScoreRingProps = {
  score: number;
};

export function ScoreRing({ score }: ScoreRingProps) {
  const meta = getOverallScoreMeta(score);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border p-8",
        meta.borderClass,
      )}
    >
      <div className="relative size-44">
        <svg className="size-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-slate-200"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            className={cn(meta.ringClass, "transition-all duration-700")}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-5xl font-bold tabular-nums", meta.textClass)}>
            {score}
          </span>
          <span className={cn("mt-1 text-sm font-semibold", meta.textClass)}>
            {meta.label}
          </span>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        AI-Powered ATS Score by Tailor Your Resume
      </p>
    </div>
  );
}
