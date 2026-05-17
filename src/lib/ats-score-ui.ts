export function getOverallScoreMeta(score: number): {
  label: string;
  ringClass: string;
  textClass: string;
  borderClass: string;
} {
  if (score <= 50) {
    return {
      label: "Poor",
      ringClass: "stroke-red-500",
      textClass: "text-red-600",
      borderClass: "border-red-200 bg-red-50",
    };
  }

  if (score <= 70) {
    return {
      label: "Fair",
      ringClass: "stroke-amber-500",
      textClass: "text-amber-600",
      borderClass: "border-amber-200 bg-amber-50",
    };
  }

  if (score <= 85) {
    return {
      label: "Good",
      ringClass: "stroke-emerald-500",
      textClass: "text-emerald-600",
      borderClass: "border-emerald-200 bg-emerald-50",
    };
  }

  return {
    label: "Excellent",
    ringClass: "stroke-green-500",
    textClass: "text-green-600",
    borderClass: "border-green-200 bg-green-50",
  };
}

export function getSeverityStyles(severity: "high" | "medium" | "low") {
  switch (severity) {
    case "high":
      return {
        dot: "bg-red-500",
        badge: "bg-red-100 text-red-700",
      };
    case "medium":
      return {
        dot: "bg-amber-500",
        badge: "bg-amber-100 text-amber-800",
      };
    default:
      return {
        dot: "bg-slate-400",
        badge: "bg-slate-100 text-slate-700",
      };
  }
}

export const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
