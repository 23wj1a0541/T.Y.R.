const COMPILE_API = "/api/compile-latex";

export async function compileLatexToPdfBlob(latex: string): Promise<Blob> {
  const response = await fetch(COMPILE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "LaTeX compilation failed");
  }

  const blob = await response.blob();

  if (blob.type && !blob.type.includes("pdf") && blob.size === 0) {
    throw new Error("LaTeX compilation failed");
  }

  return blob;
}

export function sanitizeResumeFilename(name: string): string {
  const base = name.trim() || "resume";
  return `${base.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase()}.pdf`;
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
