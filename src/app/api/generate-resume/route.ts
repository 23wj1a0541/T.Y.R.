import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are an expert resume writer and LaTeX typesetter. You help job seekers create professional, ATS-optimized resumes. When given a user's background description and their profile information, you generate a complete, valid LaTeX resume document. 

CRITICAL OUTPUT RULES:
- Return ONLY the raw, complete, valid LaTeX document. 
- Absolutely NO conversational text before or after the code. 
- Do NOT wrap the code in markdown code fences (no \`\`\`latex or \`\`\` blocks). The response must start immediately with \\documentclass and end with \\end{document}.
- Make the resume ATS-friendly: no tables for layout, no multi-column layouts, use clear section headings.
- Use strong action verbs (Led, Built, Developed, Increased, Reduced, Managed).
- Quantify achievements wherever possible (add realistic placeholder numbers if none are explicitly provided).
- Keep it to exactly one page.
- Include all standard sections: Contact, Summary, Experience, Education, Skills, Projects (if applicable).
- LATEX PACKAGE RULE: Use standard packages only (geometry, hyperref, enumitem, titlesec, fontenc, inputenc, parskip). When loading parskip, do NOT pass it as an option (use \\usepackage{parskip}, never \\usepackage[parskip]{parskip}), to ensure it compiles flawlessly.`;

type GenerateResumeBody = {
  description?: string;
  template?: string;
  userProfile?: Record<string, unknown>;
};

function buildUserMessage(
  description: string,
  template: string,
  userProfile: Record<string, unknown>,
): string {
  return `User description: ${description}

User profile data: ${JSON.stringify(userProfile)}

Generate a complete LaTeX resume using the ${template} template style. Fill in as much real information from the user profile as possible while utilizing the user description for specific optimization targeting.`;
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

  return "Failed to generate resume";
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 },
      );
    }

    let body: GenerateResumeBody;

    try {
      body = (await request.json()) as GenerateResumeBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    const description = body.description?.trim();
    const template = body.template?.trim();
    const userProfile =
      body.userProfile && typeof body.userProfile === "object"
        ? body.userProfile
        : {};

    if (!description) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 },
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: "template is required" },
        { status: 400 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completionStream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 4000,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserMessage(description, template, userProfile),
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
