/**
 * Ollama REST API client — server-side only (used in API routes).
 * Every function takes `baseUrl` so the caller controls which Ollama
 * instance is targeted (the user picks the URL in Settings).
 */

const DEFAULT_URL = "http://localhost:11434";

/**
 * Validate and sanitize an Ollama URL to prevent SSRF attacks.
 * Only allows http/https protocols and blocks private/internal IP ranges
 * (except localhost/127.0.0.1 which are needed for local Ollama).
 */
export function validateOllamaUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid Ollama URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Ollama URL must use http or https protocol");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block cloud metadata endpoints
  if (
    hostname === "169.254.169.254" ||
    hostname === "metadata.google.internal"
  ) {
    throw new Error("Ollama URL points to a blocked address");
  }

  // Check if hostname is an IP address
  const ipMatch = hostname.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
  );
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    const isLocalhost = hostname === "127.0.0.1";
    const isBlockedPrivate =
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0;

    if (isBlockedPrivate && !isLocalhost) {
      throw new Error(
        "Ollama URL must not point to a private/internal IP range",
      );
    }
  }

  return parsed.origin;
}

export async function checkOllamaRunning(
  baseUrl: string = DEFAULT_URL,
): Promise<boolean> {
  try {
    const res = await fetch(baseUrl, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listModels(
  baseUrl: string = DEFAULT_URL,
): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}

export async function generate(
  baseUrl: string = DEFAULT_URL,
  model: string,
  prompt: string,
  options?: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: "json",
      options: {
        num_ctx: 16384,
        temperature: 0.05,
        ...options,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Ollama generate error: ${text}`);
  }

  const data = await res.json();
  return data.response;
}

export async function chatStream(
  baseUrl: string = DEFAULT_URL,
  model: string,
  messages: { role: string; content: string }[],
  options?: Record<string, unknown>,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        num_ctx: 8192,
        temperature: 0.7,
        ...options,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Ollama chat error: ${text}`);
  }

  if (!res.body) throw new Error("No response body from Ollama");
  return res.body;
}
