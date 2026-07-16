/**
 * GET /api/health
 *
 * Lightweight health check for Vercel Functions.
 * Returns status, timestamp, and the active AI model.
 */

import { MODEL } from "./_lib/groq.js";
import { jsonResponse, handleOptions } from "./_lib/utils.js";

export async function GET(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  return jsonResponse(
    {
      status: "ok",
      service: "Baǵdar API",
      model: MODEL,
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    },
    200,
    origin
  );
}

/** CORS preflight */
export async function OPTIONS(request: Request): Promise<Response> {
  const preflight = handleOptions(request);
  return preflight ?? new Response(null, { status: 204 });
}
