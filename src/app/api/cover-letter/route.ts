import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are an elite professional cover letter copywriter, executive storyteller, and corporate branding strategist. Your job is to draft compelling, deeply personalized, persuasive cover letters that command attention and land interviews. 

CRITICAL WRITING & STREAMING RULES:
- Stream back your writing instantly using clean plain text formatting. Do NOT wrap the entire response in markdown code blocks or fences (no \`\`\` or \`\`\` blocks). 
- Start writing the cover letter IMMEDIATELY. Absolutely no conversational intro filler ('Sure, here is your cover letter:') or closing remarks.
- Adapt your vocabulary and sentence structures strictly to match the requested user 'tone' parameter (Professional, Enthusiastic, or Casual).
- NEVER use generic, robotic, or standard AI filler phrases like 'I am writing to express my intense interest in...', 'Enclosed please find my resume...', or 'As a highly motivated professional...'. 
- Start the letter with a powerful narrative hook that connects a key achievement from the user's background directly to a core problem mentioned in the job description.
- Restrict the core structural composition to EXACTLY 3 powerful, highly intentional paragraphs:
  1. Paragraph 1: The Hook. Immediate value hook, target alignment, and identifying why the company's specific mission/product scale excites the applicant.
  2. Paragraph 2: The Core Match. Connect specific tools, metric-backed scale, or real-world project results directly to the required responsibilities in the job description.
  3. Paragraph 3: The Close. High-conviction summary closing statement, brief call-to-action regarding an interview timeline, and a professional sign-off placeholder (e.g., 'Sincerely, [Your Name]').`;

type CoverLetterBody = {
  resumeText?: string;
  jobDescription?: string;
  userProfile?: Record<string, unknown>;
  tone?: string;
};

function buildUserMessage(
  jobDescription: string,
  resumeText: string,
  userProfile: Record<string, unknown>,
  tone: string,
): string {
  return `Draft a custom cover letter based on this precise data suite:

Target Job Description:
${jobDescription}

Applicant Resume Details:
${resumeText}

Additional Verified Vault Profile Data:
${JSON.stringify(userProfile)}

Requested Copywriting Tone:
${tone} (Adjust pacing: Professional = elegant/authoritative; Enthusiastic = passionate/high-energy; Casual = conversational/modern-startup style).`;
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

  return "Failed to generate cover letter";
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 },
      );
    }

    let body: CoverLetterBody;

    try {
      body = (await request.json()) as CoverLetterBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const resumeText = body.resumeText?.trim();
    const jobDescription = body.jobDescription?.trim();
    const tone = body.tone?.trim();
    const userProfile =
      body.userProfile && typeof body.userProfile === "object"
        ? body.userProfile
        : {};

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

    if (!tone) {
      return NextResponse.json({ error: "tone is required" }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completionStream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 2000,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserMessage(
            jobDescription,
            resumeText,
            userProfile,
            tone,
          ),
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
          console.error("[cover-letter] Stream error", streamError);
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
    console.error("[cover-letter] Request failed", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
