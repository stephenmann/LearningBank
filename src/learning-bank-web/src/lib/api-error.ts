import { NextResponse } from "next/server";

interface UpstreamError {
  status?: number;
  message?: string;
}

function safeMessageFor(status: number): string {
  if (status === 400 || status === 422) return "The request was invalid. Please check your input and try again.";
  if (status === 401 || status === 403) return "You are not authorized to perform this action.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 409) return "This action conflicts with the current state. Please refresh and try again.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  return "Something went wrong. Please try again.";
}

/**
 * Maps an upstream/backend error to a safe, user-friendly JSON response.
 * The raw backend error is logged server-side only and never returned to the
 * browser, so stack traces or internal detail are not exposed to the UI.
 */
export function errorResponse(e: unknown): NextResponse {
  const err = (e ?? {}) as UpstreamError;
  const status = err.status ?? 500;

  // Server-side log only (not returned to the client).
  console.error(`[api-proxy] upstream error ${status}: ${err.message ?? "unknown"}`);

  return NextResponse.json({ error: safeMessageFor(status) }, { status });
}
