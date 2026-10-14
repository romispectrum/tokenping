import { jsonError } from "~~/services/api/server/http";
import { respondWithNotificationCheck } from "~~/services/api/server/notificationCheck";

/**
 * GET /api/notifications/check
 * Development only (404 otherwise): runs the cron's notification pass immediately.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return jsonError("This endpoint is only available in development", 404);
  }

  return respondWithNotificationCheck();
}
