import Groq from "groq-sdk";
import { NextResponse } from "next/server";

import type {
  AdjacentSkill,
  LearningPlanItem,
  MatchedSkill,
  MissingCriticalSkill,
  MissingGoodToHaveSkill,
  SkillsGapResult,
} from "@/types/skills-gap";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a brilliant career coach, technical resume auditor, and skills matrix mapping expert. Your job is to rigorously cross-reference a candidate's resume text against a target job description, pinpoint exactly where their background aligns, identify critical structural skill gaps, and map out a precise blueprint to bridge those missing links.

CRITICAL OUTPUT CONTROL RULES:
- You must respond with a SINGLE, VALID JSON OBJECT ONLY matching the requested structure.
- Absolutely NO conversational introductory text, no pleasantries, and no trailing notes.
- Do NOT wrap your response in markdown code fences (no \`\`\`json or \`\`\` blocks). The output string must start immediately with '{' and end with '}'.
- Every key specified in the schema must be populated. Do not hallucinate fields or truncate arrays.`;

type SkillsGapBody = {
  resumeText?: string;
  jobDescription?: string;
};

function buildUserMessage(resumeText: string, jobDescription: string): string {
  return `Analyze the skills gap between the candidate's resume and the job description.

Candidate Resume Text:
${resumeText}

Target Job Description:
${jobDescription}

Return a raw JSON object matching this exact TypeScript structure without deviation:
{
  "match_percentage": number (an integer from 0-100 indicating semantic alignment),
  "matched_skills": [
    {
      "skill": "string (name of the tool, language, or methodology matched)",
      "found_in_resume": "string (1 concise sentence explaining exactly where or in what context it was found in their resume text)"
    }
  ],
  "missing_critical": [
    {
      "skill": "string (name of core missing technical requirement)",
      "importance": "must-have" | "nice-to-have",
      "how_to_bridge": "string (1 clear advice phrase detailing how to emphasize related experience or clear framing to offset the gap)"
    }
  ],
  "missing_good_to_have": [
    {
      "skill": "string (secondary missing tool or soft skill)",
      "suggestion": "string (1 quick structural tip on how to highlight this asset if they possess it)"
    }
  ],
  "adjacent_skills": [
    {
      "you_have": "string (a tool or language they have in their resume)",
      "bridges_to": "string (a target requirement in the job description they lack)",
      "how": "string (1 practical sentence explaining how having skill A makes learning or performing skill B highly intuitive)"
    }
  ],
  "quick_wins": string[] (an array of exactly 3 highly actionable, immediate text modifications or formatting reframes they can add to their resume right now to bypass ATS filters for this job),
  "learning_plan": [
    {
      "skill": "string (name of the skill to master)",
      "resource": "string (a highly realistic, specific learning avenue, e.g., 'Official documentation', 'Fast-track crash course')",
      "timeframe": "string (estimated time to reach baseline proficiency, e.g., '3 days', '1 week')"
    }
  ]
}`;
}

function sanitizeJsonContent(raw: string): string {
  let cleaned = raw.trim();

  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return cleaned;
}

function clampMatchPercentage(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function normalizeMatchedSkill(item: unknown): MatchedSkill {
  const record = (item ?? {}) as Record<string, unknown>;
  return {
    skill: typeof record.skill === "string" ? record.skill : "",
    found_in_resume:
      typeof record.found_in_resume === "string" ? record.found_in_resume : "",
  };
}

function normalizeMissingCritical(item: unknown): MissingCriticalSkill {
  const record = (item ?? {}) as Record<string, unknown>;
  const importance = record.importance;

  return {
    skill: typeof record.skill === "string" ? record.skill : "",
    importance:
      importance === "must-have" || importance === "nice-to-have"
        ? importance
        : "must-have",
    how_to_bridge:
      typeof record.how_to_bridge === "string" ? record.how_to_bridge : "",
  };
}

function normalizeMissingGoodToHave(item: unknown): MissingGoodToHaveSkill {
  const record = (item ?? {}) as Record<string, unknown>;
  return {
    skill: typeof record.skill === "string" ? record.skill : "",
    suggestion:
      typeof record.suggestion === "string" ? record.suggestion : "",
  };
}

function normalizeAdjacentSkill(item: unknown): AdjacentSkill {
  const record = (item ?? {}) as Record<string, unknown>;
  return {
    you_have: typeof record.you_have === "string" ? record.you_have : "",
    bridges_to: typeof record.bridges_to === "string" ? record.bridges_to : "",
    how: typeof record.how === "string" ? record.how : "",
  };
}

function normalizeLearningPlanItem(item: unknown): LearningPlanItem {
  const record = (item ?? {}) as Record<string, unknown>;
  return {
    skill: typeof record.skill === "string" ? record.skill : "",
    resource: typeof record.resource === "string" ? record.resource : "",
    timeframe: typeof record.timeframe === "string" ? record.timeframe : "",
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeQuickWins(value: unknown): string[] {
  const wins = normalizeStringArray(value).slice(0, 3);
  while (wins.length < 3) {
    wins.push("Align resume keywords with the job description terminology.");
  }
  return wins;
}

function normalizeSkillsGapResult(raw: unknown): SkillsGapResult {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    match_percentage: clampMatchPercentage(data.match_percentage),
    matched_skills: Array.isArray(data.matched_skills)
      ? data.matched_skills.map(normalizeMatchedSkill).filter((s) => s.skill)
      : [],
    missing_critical: Array.isArray(data.missing_critical)
      ? data.missing_critical
          .map(normalizeMissingCritical)
          .filter((s) => s.skill)
      : [],
    missing_good_to_have: Array.isArray(data.missing_good_to_have)
      ? data.missing_good_to_have
          .map(normalizeMissingGoodToHave)
          .filter((s) => s.skill)
      : [],
    adjacent_skills: Array.isArray(data.adjacent_skills)
      ? data.adjacent_skills
          .map(normalizeAdjacentSkill)
          .filter((s) => s.you_have && s.bridges_to)
      : [],
    quick_wins: normalizeQuickWins(data.quick_wins),
    learning_plan: Array.isArray(data.learning_plan)
      ? data.learning_plan
          .map(normalizeLearningPlanItem)
          .filter((s) => s.skill)
      : [],
  };
}

function getErrorDetails(error: unknown): string {
  if (error instanceof Groq.APIError) {
    if (error.status === 429) {
      return "Groq rate limit exceeded. Please try again in a moment.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error: "Skills Gap Analysis failed to compile structurally",
          details: "Groq API key is not configured",
        },
        { status: 500 },
      );
    }

    let body: SkillsGapBody;

    try {
      body = (await request.json()) as SkillsGapBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const resumeText = body.resumeText?.trim();
    const jobDescription = body.jobDescription?.trim();

    if (!resumeText) {
      return NextResponse.json(
        { error: "resumeText is required" },
        { status: 400 },
      );
    }

    if (!jobDescription) {
      return NextResponse.json(
        { error: "jobDescription is required" },
        { status: 400 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserMessage(resumeText, jobDescription),
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    if (!rawContent.trim()) {
      return NextResponse.json(
        {
          error: "Skills Gap Analysis failed to compile structurally",
          details: "Groq returned an empty response",
        },
        { status: 500 },
      );
    }

    const sanitized = sanitizeJsonContent(rawContent);
    const parsed = JSON.parse(sanitized) as unknown;
    const result = normalizeSkillsGapResult(parsed);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[skills-gap] Request failed", error);
    return NextResponse.json(
      {
        error: "Skills Gap Analysis failed to compile structurally",
        details: getErrorDetails(error),
      },
      { status: 500 },
    );
  }
}
