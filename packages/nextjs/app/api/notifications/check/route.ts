import { NextResponse } from "next/server";
import { runNotificationCheck } from "~~/services/notifications/runNotificationCheck";

/**
 * GET /api/notifications/check
 * For development: triggers the notification check immediately (same logic as cron).
 * Only allowed when NODE_ENV === 'development'.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "This endpoint is only available in development" }, { status: 404 });
  }

  const result = await runNotificationCheck();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
