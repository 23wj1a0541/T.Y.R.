/** Strip markdown fences and trim preamble/epilogue from LLM LaTeX output. */
export function sanitizeGeneratedLatex(raw: string): string {
  let result = raw.trim();

  result = result.replace(/^```(?:latex|tex)?\s*\r?\n?/i, "");
  result = result.replace(/\r?\n?```\s*$/i, "");

  const documentStart = result.indexOf("\\documentclass");
  if (documentStart > 0) {
    result = result.slice(documentStart);
  }

  const documentEnd = result.lastIndexOf("\\end{document}");
  if (documentEnd !== -1) {
    result = result.slice(0, documentEnd + "\\end{document}".length);
  }

  return result.trim();
}
