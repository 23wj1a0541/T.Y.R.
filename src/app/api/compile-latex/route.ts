import { NextResponse } from "next/server";

const LATEX_ONLINE_URL = "https://latexonline.cc/compile";

export async function POST(request: Request) {
  try {
    const { latex } = (await request.json()) as { latex?: string };

    if (!latex?.trim()) {
      return NextResponse.json(
        { error: "LaTeX content is required" },
        { status: 400 },
      );
    }

    let response = await fetch(LATEX_ONLINE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text: latex }),
    });

    if (!response.ok) {
      const compileUrl = `${LATEX_ONLINE_URL}?text=${encodeURIComponent(latex)}`;
      response = await fetch(compileUrl, { method: "GET" });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Compilation failed");
      return NextResponse.json(
        { error: errorText || "LaTeX compilation failed" },
        { status: response.status || 500 },
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Compilation request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
