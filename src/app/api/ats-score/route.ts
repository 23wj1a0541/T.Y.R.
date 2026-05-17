import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.3-70b-versatile";

type AtsScoreBody = {
  jobDescription?: string;
  resumeLatex?: string;
  beforeResume?: string;
  afterResume?: string;
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

  return "Failed to calculate ATS score";
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseScore(raw: string): number {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    const parsed = JSON.parse(cleaned) as { score?: number };
    if (typeof parsed.score === "number" && !Number.isNaN(parsed.score)) {
      return clampScore(parsed.score);
    }
  } catch {
    // fall through to numeric parse
  }

  const match = cleaned.match(/\d{1,3}/);
  if (match) {
    return clampScore(Number(match[0]));
  }

  throw new Error("Could not parse ATS score from model response");
}

async function scoreResume(
  groq: Groq,
  jobDescription: string,
  resumeLatex: string,
): Promise<number> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.15,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content:
          'You simulate ATS keyword match scoring. Respond with ONLY JSON: {"score": number} where score is 0-100 integer based on keyword overlap, role fit, skills alignment, and experience relevance. Be consistent and realistic.',
      },
      {
        role: "user",
        content: `Job Description:\n${jobDescription}\n\nResume (LaTeX/plain text):\n${resumeLatex.slice(0, 12000)}\n\nReturn the ATS match score.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  return parseScore(raw);
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 },
      );
    }

    let body: AtsScoreBody;

    try {
      body = (await request.json()) as AtsScoreBody;
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

    const beforeResume = (body.beforeResume ?? body.resumeLatex)?.trim();
    const afterResume = body.afterResume?.trim();

    if (!beforeResume && !afterResume) {
      return NextResponse.json(
        { error: "resumeLatex or beforeResume is required" },
        { status: 400 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    if (beforeResume && afterResume) {
      const [beforeScore, afterScore] = await Promise.all([
        scoreResume(groq, jobDescription, beforeResume),
        scoreResume(groq, jobDescription, afterResume),
      ]);

      return NextResponse.json({ beforeScore, afterScore, score: afterScore });
    }

    const resume = (afterResume ?? beforeResume)!;
    const score = await scoreResume(groq, jobDescription, resume);

    return NextResponse.json({ score });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
