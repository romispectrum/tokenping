import "server-only";
import { jsonError } from "~~/services/api/server/http";
import { isAccessActive } from "~~/services/payments/checkAccess";

/** 403 with `message` unless the wallet (the signed-in one, from requireSessionWallet) has active paid access, else null. */
export const requireActiveAccess = async (userId: string, message: string) =>
  (await isAccessActive(userId)) ? null : jsonError(message, 403);
