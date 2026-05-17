import type { ResumeContent } from "@/types/database";
import type { InterviewQuestionType } from "@/types/interview";

export const QUESTION_COUNT_OPTIONS = [5, 10, 20] as const;
export type QuestionCountOption = (typeof QUESTION_COUNT_OPTIONS)[number];

export const QUESTION_TYPE_OPTIONS: {
  value: InterviewQuestionType;
  label: string;
}[] = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "situational", label: "Situational" },
  { value: "general", label: "General" },
];

export type StarSectionKey = "S" | "T" | "A" | "R";

export type StarSection = {
  key: StarSectionKey;
  label: string;
  content: string;
};

export const STAR_SECTION_STYLES: Record<
  StarSectionKey,
  { container: string; label: string }
> = {
  S: {
    container: "rounded-lg border border-blue-200/80 bg-blue-50/90 px-4 py-3",
    label: "text-blue-800",
  },
  T: {
    container:
      "rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3",
    label: "text-amber-900",
  },
  A: {
    container:
      "rounded-lg border border-violet-200/80 bg-violet-50/90 px-4 py-3",
    label: "text-violet-900",
  },
  R: {
    container:
      "rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-4 py-3",
    label: "text-emerald-900",
  },
};

export function resumeContentToPlainText(
  content: ResumeContent | undefined,
  latex: string,
): string {
  const fromLatex = stripLatexToPlainText(latex);
  if (fromLatex.length > 120) {
    return fromLatex;
  }

  if (!content) {
    return fromLatex;
  }

  const parts: string[] = [];

  if (content.summary?.trim()) {
    parts.push(`Summary: ${content.summary.trim()}`);
  }

  for (const job of content.workExperience ?? []) {
    parts.push(
      `${job.title} at ${job.company} (${job.startDate} – ${job.current ? "Present" : job.endDate ?? ""}): ${job.description}`,
    );
    for (const achievement of job.achievements ?? []) {
      parts.push(`- ${achievement}`);
    }
  }

  for (const edu of content.education ?? []) {
    parts.push(
      `${edu.degree} in ${edu.field}, ${edu.institution} (${edu.startDate} – ${edu.endDate ?? ""})`,
    );
  }

  for (const project of content.projects ?? []) {
    parts.push(
      `Project ${project.name}: ${project.description}. Tech: ${(project.technologies ?? []).join(", ")}`,
    );
  }

  const skills = (content.skills ?? []).map((s) => s.name).filter(Boolean);
  if (skills.length > 0) {
    parts.push(`Skills: ${skills.join(", ")}`);
  }

  const structured = parts.join("\n\n").trim();
  return structured || fromLatex;
}

function stripLatexToPlainText(latex: string): string {
  if (!latex.trim()) return "";

  return latex
    .replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, " ")
    .replace(/\\[a-zA-Z@]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, " ")
    .replace(/[{}$%#&_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRatingStars(markdown: string): number {
  const ratingBlock = markdown.match(
    /###\s*🏆\s*Rating:[\s\S]*?(?=\n###|$)/i,
  );
  const source = ratingBlock?.[0] ?? markdown;
  const stars = source.match(/⭐/g);
  if (stars && stars.length > 0) {
    return Math.min(5, Math.max(1, stars.length));
  }

  const numeric = source.match(/(\d)\s*\/\s*5/);
  if (numeric) {
    return Math.min(5, Math.max(1, Number(numeric[1])));
  }

  return 0;
}

export function extractSuggestedStarAnswer(markdown: string): string {
  const start = markdown.search(/###\s*🚀\s*Suggested Star Answer:/i);
  if (start === -1) return "";

  const afterTitle = markdown.slice(start);
  const withoutTitle = afterTitle.replace(
    /^###\s*🚀\s*Suggested Star Answer:\s*/i,
    "",
  );

  const nextHeading = withoutTitle.search(/\n###\s/);
  const section =
    nextHeading === -1
      ? withoutTitle
      : withoutTitle.slice(0, nextHeading);

  return section.trim();
}

export function parseStarSections(text: string): StarSection[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const sectionDefs: {
    key: StarSectionKey;
    label: string;
    pattern: RegExp;
  }[] = [
    {
      key: "S",
      label: "Situation (S)",
      pattern:
        /(?:\*\*)?(?:Situation|S(?:ituation)?)\s*(?:\(S\))?(?:\*\*)?\s*:?\s*/i,
    },
    {
      key: "T",
      label: "Task (T)",
      pattern: /(?:\*\*)?(?:Task|T(?:ask)?)\s*(?:\(T\))?(?:\*\*)?\s*:?\s*/i,
    },
    {
      key: "A",
      label: "Action (A)",
      pattern:
        /(?:\*\*)?(?:Action|A(?:ction)?)\s*(?:\(A\))?(?:\*\*)?\s*:?\s*/i,
    },
    {
      key: "R",
      label: "Result (R)",
      pattern:
        /(?:\*\*)?(?:Result|R(?:esult)?)\s*(?:\(R\))?(?:\*\*)?\s*:?\s*/i,
    },
  ];

  const markers: { index: number; def: (typeof sectionDefs)[number] }[] = [];

  for (const def of sectionDefs) {
    const match = def.pattern.exec(normalized);
    if (match && match.index !== undefined) {
      markers.push({ index: match.index, def });
    }
  }

  if (markers.length === 0) {
    return [];
  }

  markers.sort((a, b) => a.index - b.index);

  const sections: StarSection[] = [];

  for (let i = 0; i < markers.length; i++) {
    const { index, def } = markers[i];
    const sliceStart = index;
    const sliceEnd = markers[i + 1]?.index ?? normalized.length;
    const chunk = normalized.slice(sliceStart, sliceEnd);
    const content = chunk.replace(def.pattern, "").trim();

    if (content) {
      sections.push({ key: def.key, label: def.label, content });
    }
  }

  return sections;
}

export function difficultyBadgeClass(
  difficulty: "easy" | "medium" | "hard",
): string {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "hard":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-amber-100 text-amber-900 border-amber-200";
  }
}

export function typeBadgeClass(type: InterviewQuestionType): string {
  switch (type) {
    case "technical":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "behavioral":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "situational":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}
