/**
 * Groq client — singleton with structured output support.
 *
 * Groq provides ultra-fast LLM inference via an OpenAI-compatible API.
 * We use `openai/gpt-oss-120b` with strict JSON schema mode for
 * guaranteed structured responses — no parsing, no surprises.
 */

import Groq from "groq-sdk";

/** Groq model for structured roadmap generation */
export const MODEL = "openai/gpt-oss-120b" as const;

/** Global singleton — reused across warm instances */
let _client: Groq | null = null;

function getClient(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Get yours at https://console.groq.com"
      );
    }
    _client = new Groq({ apiKey });
  }
  return _client;
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
 * Uses `response_format: json_schema` with `strict: true` so the model
 * output is guaranteed valid and matches our schema exactly.
 */
export async function generateStructured<T>({
  systemPrompt,
  userMessage,
  jsonSchema,
  schemaName = "response",
  maxTokens = 4096,
  temperature = 0.7,
}: StructuredCompletionOptions): Promise<T> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: {
      // `json_schema` is supported by Groq API but may not be in SDK types yet
      type: "json_schema" as any,
      json_schema: {
        name: schemaName,
        strict: true,
        schema: jsonSchema as Record<string, unknown>,
      },
    } as any,
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq API");
  }

  return JSON.parse(content) as T;
}
