import { NextResponse } from "next/server";
import "server-only";

export const MISSING_USER_ID = "Missing or invalid userId";

export const INTERNAL_ERROR = "Something went wrong. Please try again.";

export const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

/**
 * 500 with a generic `message`; the error itself goes to the server log only. A Supabase, RPC or provider message can
 * name tables, columns, hosts or settings, so it never reaches the caller. `logPrefix` names the route, e.g.
 * "PUT /api/notifications/config".
 */
export const internalError = (logPrefix: string, error: unknown, message = INTERNAL_ERROR) => {
  console.error(`${logPrefix}: failed`, error);
  return jsonError(message, 500);
};

/** The JSON body when it is an object; malformed JSON, null, arrays and primitives read as {}. */
export const readJsonObject = async (request: Request): Promise<Record<string, unknown>> => {
  const body: unknown = await request.json().catch(() => null);
  return typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
};

/** The trimmed user id, or null when it is missing, not a string, or blank. */
export const parseUserId = (raw: unknown) => (typeof raw === "string" && raw.trim() ? raw.trim() : null);

const INTEGER_PATTERN = /^-?\d+$/;

/** Query-string chain id: undefined when absent or empty, null unless it is a whole decimal (safe) integer. */
export const parseChainId = (raw: string | null) => {
  if (raw === null || raw === "") return undefined;
  const trimmed = raw.trim();
  const chainId = Number(trimmed);
  return INTEGER_PATTERN.test(trimmed) && Number.isSafeInteger(chainId) ? chainId : null;
};

/** JSON-body chain id: a safe integer, like the column it is stored in. The route checks that the app reads it. */
export const isChainId = (value: unknown): value is number => Number.isSafeInteger(value);
