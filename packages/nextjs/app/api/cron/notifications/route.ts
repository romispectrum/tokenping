import { hasBearerSecret } from "~~/services/api/server/auth";
import { jsonError } from "~~/services/api/server/http";
import { respondWithNotificationCheck } from "~~/services/api/server/notificationCheck";

function isAuthorized(request: Request): boolean {
  // Preferred auth: shared bearer secret (set CRON_SECRET in Vercel env vars)
  const secret = process.env.CRON_SECRET;
  if (secret) return hasBearerSecret(request, secret);

  // Fallback for Vercel cron requests when CRON_SECRET is not configured. These headers can be spoofed by any client,
  // but rejecting them would silently stop all alerts on a deployment without the secret.
  const userAgent = request.headers.get("user-agent") ?? "";
  if (request.headers.get("x-vercel-cron") === "1" || userAgent.toLowerCase().includes("vercel-cron")) {
    console.warn("CRON_SECRET is not set: authorized the cron run by its Vercel headers, which can be spoofed");
    return true;
  }
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return jsonError("Unauthorized", 401);

  return respondWithNotificationCheck();
}
