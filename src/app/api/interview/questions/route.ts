import { randomUUID } from "crypto";

import Groq from "groq-sdk";
import { NextResponse } from "next/server";

import type {
  InterviewQuestion,
  InterviewQuestionDifficulty,
  InterviewQuestionType,
} from "@/types/interview";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_QUESTION_COUNT = 25;

const SYSTEM_PROMPT = `You are a elite technical recruiter, engineering manager, and expert interviewer at a top-tier tech firm. Your job is to analyze a candidate's resume against a specific job description and generate deeply contextual interview questions.

CRITICAL OUTPUT RULES:
- You must respond with a SINGLE, VALID JSON ARRAY containing precisely the requested number of question objects.
- Absolutely NO conversational conversational filler text or introductory/closing remarks.
- Do NOT wrap the code in markdown code fences (no \`\`\`json or \`\`\` blocks). The output string must start immediately with '[' and end with ']'.
- Ensure types match the schema definitions perfectly.`;

type QuestionsBody = {
  resumeText?: string;
  jobDescription?: string;
  count?: number;
};

function buildUserMessage(
  resumeText: string,
  jobDescription: string,
  count: number,
): string {
  return `Generate exactly ${count} highly relevant interview questions for this candidate based on their background and the target role.

Resume Content:
${resumeText}

Job Description Context:
${jobDescription}

Return a raw JSON array matching this exact schema layout structure without deviation:
[
  {
    "id": "string (generate a unique uuid string)",
    "question": "string (the actual interview question text)",
    "type": "behavioral" | "technical" | "situational" | "general",
    "difficulty": "easy" | "medium" | "hard",
    "why_asked": "string (exactly 1 highly professional sentence explaining why an interviewer asks this specific question)",
    "star_tips": "string (exactly 1 sentence giving a clear tactic based on the STAR methodology for answering this question)",
    "sample_answer_outline": "string (a brief, clear structural outline of what a high-scoring answer must hit)"
  }
]`;
}

function sanitizeJsonContent(raw: string): string {
  let cleaned = raw.trim();

  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");

  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return cleaned.slice(objectStart, objectEnd + 1);
  }

  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return cleaned.slice(arrayStart, arrayEnd + 1);
  }

  return cleaned;
}

function isQuestionType(value: unknown): value is InterviewQuestionType {
  return (
    value === "behavioral" ||
    value === "technical" ||
    value === "situational" ||
    value === "general"
  );
}

function isDifficulty(
  value: unknown,
): value is InterviewQuestionDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function normalizeQuestion(raw: unknown): InterviewQuestion {
  const record = (raw ?? {}) as Record<string, unknown>;

  return {
    id:
      typeof record.id === "string" && record.id.trim()
        ? record.id.trim()
        : randomUUID(),
    question:
      typeof record.question === "string" ? record.question.trim() : "",
    type: isQuestionType(record.type) ? record.type : "general",
    difficulty: isDifficulty(record.difficulty) ? record.difficulty : "medium",
    why_asked:
      typeof record.why_asked === "string" ? record.why_asked.trim() : "",
    star_tips:
      typeof record.star_tips === "string" ? record.star_tips.trim() : "",
    sample_answer_outline:
      typeof record.sample_answer_outline === "string"
        ? record.sample_answer_outline.trim()
        : "",
  };
}

function parseQuestionsPayload(raw: string, expectedCount: number): InterviewQuestion[] {
  const sanitized = sanitizeJsonContent(raw);
  const parsed = JSON.parse(sanitized) as unknown;

  let items: unknown[] = [];

  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { questions?: unknown }).questions)
  ) {
    items = (parsed as { questions: unknown[] }).questions;
  } else {
    throw new Error("Response is not a valid questions array");
  }

  const normalized = items
    .map((item) => normalizeQuestion(item))
    .filter((item) => item.question.length > 0);

  if (normalized.length === 0) {
    throw new Error("No valid interview questions were generated");
  }

  return normalized.slice(0, expectedCount);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Groq.APIError) {
    if (error.status === 429) {
      return "Groq rate limit exceeded. Please try again in a moment.";
    }
    return error.message || "Groq API request failed";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to generate interview questions";
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("[interview/questions] GROQ_API_KEY is not configured");
      return NextResponse.json(
        { error: "Interview question generation failed" },
        { status: 500 },
      );
    }

    let body: QuestionsBody;

    try {
      body = (await request.json()) as QuestionsBody;
    } catch (error) {
      console.error("[interview/questions] Invalid JSON body", error);
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const resumeText = body.resumeText?.trim();
    const jobDescription = body.jobDescription?.trim();
    const count =
      typeof body.count === "number" && !Number.isNaN(body.count)
        ? Math.floor(body.count)
        : NaN;

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

    if (!Number.isFinite(count) || count < 1) {
      return NextResponse.json(
        { error: "count must be a positive number" },
        { status: 400 },
      );
    }

    const questionCount = Math.min(count, MAX_QUESTION_COUNT);

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
          content: buildUserMessage(resumeText, jobDescription, questionCount),
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    if (!rawContent.trim()) {
      console.error("[interview/questions] Empty Groq response");
      return NextResponse.json(
        { error: "Interview question generation failed" },
        { status: 500 },
      );
    }

    let questions: InterviewQuestion[];

    try {
      questions = parseQuestionsPayload(rawContent, questionCount);
    } catch (parseError) {
      console.error("[interview/questions] JSON parse failure", parseError);
      return NextResponse.json(
        { error: "Interview question generation failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    console.error("[interview/questions] Request failed", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
