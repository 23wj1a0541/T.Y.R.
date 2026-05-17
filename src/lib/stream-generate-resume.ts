type GenerateResumePayload = {
  description: string;
  template: string;
  userProfile: Record<string, unknown>;
};

export async function streamGenerateResume(
  payload: GenerateResumePayload,
  onChunk: (text: string) => void,
): Promise<void> {
  const response = await fetch("/api/generate-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(errorPayload?.error ?? "Failed to generate resume");
  }

  if (!response.body) {
    throw new Error("No response stream received from the server");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;

      const parsed = JSON.parse(data) as { text?: string; error?: string };

      if (parsed.error) {
        throw new Error(parsed.error);
      }

      if (parsed.text) {
        onChunk(parsed.text);
      }
    }
  }

  if (buffer.startsWith("data: ")) {
    const data = buffer.slice(6).trim();
    if (data && data !== "[DONE]") {
      const parsed = JSON.parse(data) as { text?: string; error?: string };
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.text) onChunk(parsed.text);
    }
  }
}
