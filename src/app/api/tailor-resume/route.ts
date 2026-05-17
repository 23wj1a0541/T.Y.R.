import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) optimization specialist and professional resume writer. Your job is to rewrite a provided LaTeX resume to perfectly match a specific job description while remaining strictly truthful to the user's background.

CRITICAL PROCESSING & OUTPUT RULES:
- Return ONLY the raw, complete, valid LaTeX document. 
- Absolutely NO conversational text, introduction, or post-processing notes before or after the code. 
- Do NOT wrap the code in markdown code fences (no \`\`\`latex or \`\`\` blocks). The streamed response must begin directly with \\documentclass and end cleanly with \\end{document}.
- Mirror the exact keywords, core tools, and phrases from the job description naturally throughout the resume text.
- Reorder bullet points within experience and projects so that the most relevant achievements matching the job description appear first.
- Re-write and adjust the summary/objective section to speak directly to this specific target role and company.
- Rename generic or vague job titles to match industry-standard titles if appropriate and justified.
- Cross-reference the provided 'userProfile' object; add missing but clearly implied skills if the user's profile verified data supports them.
- Quantify every single achievement bullet point (add realistic, contextually appropriate placeholder metrics or percentages if exact ones aren't provided).
- Ensure the structural formatting fits exactly onto a single page.
- Aim for an 85%+ ATS keyword match score simulation.
- Never fabricate experience, companies, or skills the user does not possess.
- LATEX PACKAGE RULE: Use standard packages only (geometry, hyperref, enumitem, titlesec, fontenc, inputenc, parskip). When loading parskip, do NOT pass it as an option (use \\usepackage{parskip}, never \\usepackage[parskip]{parskip}), to prevent TeX compilation server failures.`;

type TailorResumeBody = {
  jobDescription?: string;
  currentResume?: string;
  userProfile?: Record<string, unknown>;
};

function buildUserMessage(
  jobDescription: string,
  currentResume: string,
  userProfile: Record<string, unknown>,
): string {
  return `Job Description:
${jobDescription}

Current Resume (LaTeX):
${currentResume}

Additional user info not in resume:
${JSON.stringify(userProfile)}

Rewrite the resume to maximize ATS score and interview chance for this specific job.`;
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

  return "Failed to tailor resume";
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 },
      );
    }

    let body: TailorResumeBody;

    try {
      body = (await request.json()) as TailorResumeBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const jobDescription = body.jobDescription?.trim();
    const currentResume = body.currentResume?.trim();
    const userProfile =
      body.userProfile && typeof body.userProfile === "object"
        ? body.userProfile
        : {};

    if (!jobDescription) {
      return NextResponse.json(
        { error: "jobDescription is required" },
        { status: 400 },
      );
    }

    if (!currentResume) {
      return NextResponse.json(
        { error: "currentResume is required" },
        { status: 400 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completionStream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.15,
      max_tokens: 4000,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserMessage(jobDescription, currentResume, userProfile),
        },
      ],
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completionStream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
              );
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamError) {
          const message = getErrorMessage(streamError);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
