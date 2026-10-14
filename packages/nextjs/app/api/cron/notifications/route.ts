import { NextResponse } from "next/server";
import { respondWithNotificationCheck } from "~~/services/api/server/notificationCheck";

type AuthResult = { ok: true } | { ok: false; reason: string };

function isAuthorized(request: Request): AuthResult {
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  const userAgent = request.headers.get("user-agent") ?? "";
  const secret = process.env.CRON_SECRET;

  // Preferred auth: shared bearer secret (set CRON_SECRET in Vercel env vars)
  if (secret) {
    if (auth === `Bearer ${secret}`) return { ok: true };
    return { ok: false, reason: "Invalid bearer token for CRON_SECRET" };
  }

  // Fallback for Vercel cron requests when CRON_SECRET is not configured.
  // BUG(B3.10): these headers can be spoofed by any client.
  if (vercelCron === "1" || userAgent.toLowerCase().includes("vercel-cron")) {
    return { ok: true };
  }

  return { ok: false, reason: "Missing CRON_SECRET and no trusted Vercel cron headers" };
}

export async function GET(request: Request) {
  const auth = isAuthorized(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized", reason: auth.reason }, { status: 401 });
  }

  return respondWithNotificationCheck();
}
