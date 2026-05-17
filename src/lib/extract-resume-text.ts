const ACCEPTED_TYPES = [
  "text/plain",
  "application/pdf",
] as const;

export function isAcceptedResumeFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
    return true;
  }

  const name = file.name.toLowerCase();
  return name.endsWith(".txt") || name.endsWith(".pdf");
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  const combined = pages.join("\n").trim();

  if (!combined) {
    throw new Error(
      "Could not extract text from this PDF. Try a text-based PDF or paste your resume instead.",
    );
  }

  return combined;
}

export async function extractTextFromResumeFile(file: File): Promise<string> {
  if (!isAcceptedResumeFile(file)) {
    throw new Error("Only .pdf and .txt files are supported.");
  }

  const name = file.name.toLowerCase();

  if (file.type === "text/plain" || name.endsWith(".txt")) {
    const text = await file.text();
    if (!text.trim()) {
      throw new Error("The text file appears to be empty.");
    }
    return text;
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractTextFromPdf(file);
  }

  throw new Error("Unsupported file type. Upload a .pdf or .txt file.");
}
