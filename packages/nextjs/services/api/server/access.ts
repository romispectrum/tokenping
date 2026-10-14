import "server-only";
import { jsonError } from "~~/services/api/server/http";
import { isAccessActive } from "~~/services/payments/checkAccess";

/**
 * 403 with `message` unless the wallet has active paid access, else null.
 * Pass the trimmed id as the client sent it (not lowercased).
 */
export const requireActiveAccess = async (userId: string, message: string) =>
  (await isAccessActive(userId)) ? null : jsonError(message, 403);
