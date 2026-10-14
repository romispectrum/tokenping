import { NextResponse } from "next/server";
import { requireActiveAccess } from "~~/services/api/server/access";
import {
  MISSING_USER_ID,
  internalError,
  isChainId,
  jsonError,
  parseChainId,
  parseUserId,
} from "~~/services/api/server/http";
import { type ConfigInput, parseConfigInput } from "~~/services/notifications/configInput";
import {
  deleteConfigs,
  findConfigForChain,
  findConfigsForUser,
  rowToConfig,
  saveConfig,
  toConfigRow,
  userIdForms,
} from "~~/services/notifications/configRepository";

type ConfigBody = ConfigInput & { userId?: unknown; chainId?: unknown };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseUserId(searchParams.get("userId"));
    if (!userId) return jsonError(MISSING_USER_ID, 400);

    const chainId = parseChainId(searchParams.get("chainId"));
    if (chainId === null) return jsonError("Invalid chainId", 400);

    // No access check on reads, so an existing config stays visible after access expires; PUT/DELETE require it.
    // The Telegram link is per user, not per chain, and is read from /api/telegram/link.
    const forms = userIdForms(userId);

    if (chainId !== undefined) {
      const row = await findConfigForChain(forms, chainId);
      return NextResponse.json(row ? rowToConfig(row) : null);
    }

    const rows = await findConfigsForUser(forms);
    return NextResponse.json(Object.fromEntries(rows.map(row => [row.chain_id, rowToConfig(row)])));
  } catch (e) {
    // Also answers failed Supabase reads, which the repository throws.
    return internalError(e);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId: rawUserId, chainId, ...input } = body as ConfigBody;

    const userId = parseUserId(rawUserId);
    if (!userId) return jsonError(MISSING_USER_ID, 400);
    // chainId = the Aave network this config is for (position chain), NOT the wallet's connected chain
    if (!isChainId(chainId)) return jsonError("Missing or invalid chainId", 400);

    const parsed = parseConfigInput(input);
    if ("error" in parsed) return jsonError(parsed.error, 400);

    const denied = await requireActiveAccess(userId, "Active paid access required to update notification config");
    if (denied) return denied;

    const forms = userIdForms(userId);
    const error = await saveConfig(forms, toConfigRow(forms.normalized, chainId, parsed.value));
    if (error) return jsonError(error.message, 502);

    return NextResponse.json({ success: true });
  } catch (e) {
    return internalError(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId: rawUserId, chainId } = body as ConfigBody;

    const userId = parseUserId(rawUserId);
    if (!userId) return jsonError(MISSING_USER_ID, 400);
    if (!isChainId(chainId)) return jsonError("Missing or invalid chainId", 400);

    const denied = await requireActiveAccess(userId, "Active paid access required to delete notification config");
    if (denied) return denied;

    // Deletes both user id forms, so the row goes whether it was stored checksummed or lowercase.
    const forms = userIdForms(userId);
    const error = await deleteConfigs(forms, chainId);
    if (error) return jsonError(error.message, 502);

    return NextResponse.json({ success: true });
  } catch (e) {
    return internalError(e);
  }
}
