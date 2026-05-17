export type AtsIssueSeverity = "high" | "medium" | "low";

export type AtsIssue = {
  section: string;
  severity: AtsIssueSeverity;
  message: string;
  suggestion: string;
};

export type AtsScoreResult = {
  overall_score: number;
  keyword_match_score: number | null;
  format_score: number;
  completeness_score: number;
  quantification_score: number;
  readability_score: number;
  missing_keywords: string[];
  found_keywords: string[];
  issues: AtsIssue[];
  strengths: string[];
  top_fixes: string[];
};
