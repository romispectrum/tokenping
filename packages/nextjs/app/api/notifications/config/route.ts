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
import {
  getCacheKey,
  getCachedConfig,
  invalidateUserConfigCache,
  setCachedConfig,
} from "~~/services/notifications/configCache";
import {
  type ConfigInput,
  deleteConfigs,
  findConfigForChain,
  findConfigsForUser,
  rowToConfig,
  saveConfig,
  toConfigRow,
  userIdForms,
} from "~~/services/notifications/configRepository";
import { getLinkByUserId } from "~~/services/telegram/telegramLinks";

type ConfigBody = ConfigInput & { userId?: unknown; chainId?: unknown };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseUserId(searchParams.get("userId"));
    if (!userId) return jsonError(MISSING_USER_ID, 400);

    const chainId = parseChainId(searchParams.get("chainId"));
    if (chainId === null) return jsonError("Invalid chainId", 400);

    const forms = userIdForms(userId);
    const cacheKey = getCacheKey(forms.normalized, chainId);
    const cached = getCachedConfig(cacheKey);
    if (cached.hit) return NextResponse.json(cached.data);

    // No access check on reads, so an existing config stays visible after access expires; PUT/DELETE require it.
    // The Telegram link is per user (not per chain): fetched once and copied onto every config.
    const telegramLink = await getLinkByUserId(forms.normalized);

    if (chainId !== undefined) {
      const row = await findConfigForChain(forms, chainId);
      const config = row ? rowToConfig(row, telegramLink) : null;
      setCachedConfig(cacheKey, config);
      return NextResponse.json(config);
    }

    const rows = await findConfigsForUser(forms);
    const configs = Object.fromEntries(rows.map(row => [row.chain_id, rowToConfig(row, telegramLink)]));
    setCachedConfig(cacheKey, configs);
    return NextResponse.json(configs);
  } catch (e) {
    return internalError(e);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId: rawUserId, chainId, ...input } = body as ConfigBody;

    const userId = parseUserId(rawUserId);
    if (!userId) return jsonError(MISSING_USER_ID, 400);
    // chainId = the Aave network this config is for (position chain), NOT the wallet's connected chain
    if (!isChainId(chainId)) return jsonError("Missing or invalid chainId", 400);

    const denied = await requireActiveAccess(userId, "Active paid access required to update notification config");
    if (denied) return denied;

    const forms = userIdForms(userId);
    const error = await saveConfig(forms, toConfigRow(forms.normalized, chainId, input));
    if (error) return jsonError(error.message, 502);

    invalidateUserConfigCache(forms.normalized);
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

    invalidateUserConfigCache(forms.normalized);
    return NextResponse.json({ success: true });
  } catch (e) {
    return internalError(e);
  }
}
