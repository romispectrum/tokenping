import { NextResponse } from "next/server";
import "server-only";
import { getErrorMessage } from "~~/utils/errors";

export const MISSING_USER_ID = "Missing or invalid userId";

export const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

/** 500 carrying the thrown error's message, or "Unknown error". */
export const internalError = (error: unknown) => jsonError(getErrorMessage(error), 500);

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
