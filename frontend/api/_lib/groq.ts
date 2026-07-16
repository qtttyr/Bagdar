/**
 * Groq client — zero-dependency, uses native fetch().
 *
 * Groq provides ultra-fast LLM inference via an OpenAI-compatible API.
 * We call it directly with fetch() — no SDK needed.
 */

/** Groq model for structured roadmap generation */
export const MODEL = "openai/gpt-oss-120b" as const;

/** Base URL for Groq API (OpenAI-compatible) */
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/** Get the API key from environment */
function getApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it in Vercel Dashboard → Settings → Environment Variables."
    );
  }
  return key;
}

/** Options for generating a structured completion */
export interface StructuredCompletionOptions {
  systemPrompt: string;
  userMessage: string;
  jsonSchema: object;
  schemaName?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Generate a structured JSON response from Groq with strict schema adherence.
 *
 * Calls the OpenAI-compatible chat completions endpoint with
 * `response_format: { type: "json_schema", json_schema: {...} }`
 * for guaranteed valid structured output.
 */
export async function generateStructured<T>({
  systemPrompt,
  userMessage,
  jsonSchema,
  maxTokens = 4096,
  temperature = 0.7,
}: StructuredCompletionOptions): Promise<T> {
  const apiKey = getApiKey();

  // ── Request timeout: 15 seconds ──
  // Prevents hanging requests from consuming Vercel Function runtime
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
      model: MODEL,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "roadmap",
          strict: true,
          schema: jsonSchema,
        },
      },
    }),
  });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown error");
      throw new Error(
        `Groq API error (${response.status}): ${errorText}`
      );
    }

    const data: { choices?: Array<{ message?: { content?: string } }> } = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from Groq API — no content in choices");
    }

    return JSON.parse(content) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
