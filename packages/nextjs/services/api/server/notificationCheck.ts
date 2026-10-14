import { NextResponse } from "next/server";
import "server-only";
import { jsonError } from "~~/services/api/server/http";
import { runNotificationCheck } from "~~/services/notifications/runNotificationCheck";

/** Runs one notification pass: 200 with its summary, or 502 `{ error }` when the pass failed. */
export async function respondWithNotificationCheck() {
  const result = await runNotificationCheck();
  return result.success ? NextResponse.json(result) : jsonError(result.error, 502);
}
