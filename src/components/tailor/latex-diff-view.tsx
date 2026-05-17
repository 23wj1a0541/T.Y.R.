import { computeLineDiff } from "@/lib/text-diff";
import { cn } from "@/lib/utils";

type LatexDiffViewProps = {
  before: string;
  after: string;
  className?: string;
};

export function LatexDiffView({ before, after, className }: LatexDiffViewProps) {
  const lines = computeLineDiff(before, after);

  return (
    <div
      className={cn(
        "overflow-auto rounded-lg border border-slate-200 bg-slate-900 font-mono text-xs leading-relaxed",
        className,
      )}
    >
      <pre className="min-h-[280px] p-3">
        {lines.map((line, index) => (
          <span
            key={`${index}-${line.type}-${line.content.slice(0, 24)}`}
            className={cn(
              "block whitespace-pre-wrap rounded px-1",
              line.type === "added" && "bg-emerald-500/20 text-emerald-100",
              line.type === "removed" && "bg-red-500/20 text-red-200 line-through",
              line.type === "same" && "text-slate-300",
            )}
          >
            {line.type === "added" && "+ "}
            {line.type === "removed" && "- "}
            {line.type === "same" && "  "}
            {line.content || " "}
          </span>
        ))}
      </pre>
    </div>
  );
}
