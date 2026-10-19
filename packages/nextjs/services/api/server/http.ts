import { NextResponse } from "next/server";
import "server-only";
import { getErrorMessage } from "~~/utils/errors";

export const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

/** 500 carrying the thrown error's message, or "Unknown error". */
export const internalError = (error: unknown) => jsonError(getErrorMessage(error), 500);

const isJsonRequest = (request: Request) =>
  request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";

/**
 * The JSON body when it is an object and declared as `Content-Type: application/json`; anything else (a text/plain
 * body, malformed JSON, null, arrays, primitives) reads as {}.
 */
export const readJsonObject = async (request: Request): Promise<Record<string, unknown>> => {
  if (!isJsonRequest(request)) return {};
  const body: unknown = await request.json().catch(() => null);
  return typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
};

const firstHeaderValue = (request: Request, name: string) => request.headers.get(name)?.split(",")[0].trim() || null;

/**
 * The origin the browser sent the request to, e.g. https://tokenping.xyz. Vercel (like any proxy) passes the public
 * host and scheme in x-forwarded-host and x-forwarded-proto; locally they come from the Host header and the URL.
 */
export const requestOrigin = (request: Request) => {
  const url = new URL(request.url);
  const host = firstHeaderValue(request, "x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const protocol = firstHeaderValue(request, "x-forwarded-proto") ?? url.protocol.replace(/:$/, "");
  return `${protocol}://${host}`.toLowerCase();
};

/** Browsers send Origin with every POST, PUT and DELETE; without one, only a same-origin Sec-Fetch-Site passes. */
const isSameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (origin !== null) return origin.toLowerCase() === requestOrigin(request);
  return request.headers.get("sec-fetch-site") === "same-origin";
};

/**
 * CSRF guard for the routes that change state, which authenticate by cookie: 403 unless the request comes from this
 * site's own pages, and with `json` (the default) 415 unless the body is declared as JSON, which a cross-site form or
 * no-cors fetch cannot do without a CORS preflight this API never answers. Null when the request may go on.
 */
export const rejectCrossSiteRequest = (request: Request, { json = true }: { json?: boolean } = {}) => {
  if (!isSameOrigin(request)) return jsonError("Cross-site request refused", 403);
  if (json && !isJsonRequest(request)) return jsonError("Content-Type must be application/json", 415);
  return null;
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

/** JSON-body chain id: any number except NaN (no integer or range check). */
export const isChainId = (value: unknown): value is number => typeof value === "number" && !Number.isNaN(value);
