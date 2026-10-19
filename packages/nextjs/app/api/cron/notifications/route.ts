import { hasBearerSecret } from "~~/services/api/server/auth";
import { jsonError } from "~~/services/api/server/http";
import { respondWithNotificationCheck } from "~~/services/api/server/notificationCheck";

/**
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` with every cron run once CRON_SECRET is set in the project, so
 * the bearer is the only proof accepted. The x-vercel-cron and user-agent headers are never trusted: any client can
 * send them.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Logged on every refused run, so a deployment without the secret shows why no alerts go out.
    console.error(
      "CRON_SECRET is not set: refused the cron run. Set CRON_SECRET in the Vercel project; Vercel then sends it as the bearer.",
    );
    return false;
  }
  return hasBearerSecret(request, secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return jsonError("Unauthorized", 401);

  return respondWithNotificationCheck();
}
