import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.3-70b-versatile";

type JobLevel = "Junior" | "Mid" | "Senior";

type AnalyzeJdBody = {
  jobDescription?: string;
};

type AnalyzeJdResult = {
  keySkills: string[];
  requiredExperience: string;
  jobLevel: JobLevel;
};

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

  return "Failed to analyze job description";
}

function normalizeJobLevel(value: string): JobLevel {
  const normalized = value.toLowerCase();
  if (normalized.includes("senior") || normalized.includes("lead")) {
    return "Senior";
  }
  if (normalized.includes("junior") || normalized.includes("entry")) {
    return "Junior";
  }
  return "Mid";
}

function parseAnalyzeResult(raw: string): AnalyzeJdResult {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed = JSON.parse(cleaned) as {
    keySkills?: string[];
    requiredExperience?: string;
    jobLevel?: string;
  };

  const keySkills = Array.isArray(parsed.keySkills)
    ? parsed.keySkills.filter((s) => typeof s === "string" && s.trim()).slice(0, 12)
    : [];

  return {
    keySkills,
    requiredExperience:
      typeof parsed.requiredExperience === "string"
        ? parsed.requiredExperience.trim()
        : "Not specified",
    jobLevel: normalizeJobLevel(
      typeof parsed.jobLevel === "string" ? parsed.jobLevel : "Mid",
    ),
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 },
      );
    }

    let body: AnalyzeJdBody;

    try {
      body = (await request.json()) as AnalyzeJdBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const jobDescription = body.jobDescription?.trim();

    if (!jobDescription) {
      return NextResponse.json(
        { error: "jobDescription is required" },
        { status: 400 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.15,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "You extract structured hiring requirements from job descriptions. Respond with ONLY valid JSON, no markdown fences. Schema: {\"keySkills\": string[], \"requiredExperience\": string, \"jobLevel\": \"Junior\"|\"Mid\"|\"Senior\"}. keySkills: 5-10 concise skill/tool phrases. requiredExperience: one sentence summary. jobLevel: pick the best single level.",
        },
        {
          role: "user",
          content: `Analyze this job description:\n\n${jobDescription}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    if (!raw.trim()) {
      return NextResponse.json(
        { error: "Empty response from analysis service" },
        { status: 500 },
      );
    }

    const result = parseAnalyzeResult(raw);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
