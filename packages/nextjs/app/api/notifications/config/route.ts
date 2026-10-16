import { NextResponse } from "next/server";
import { type MarketId, V3_MARKET_ID, isMarketId, resolveMarket } from "~~/config/aaveConfig";
import { requireActiveAccess } from "~~/services/api/server/access";
import {
  MISSING_USER_ID,
  internalError,
  isChainId,
  jsonError,
  parseChainId,
  parseUserId,
  readJsonObject,
} from "~~/services/api/server/http";
import { type ConfigInput, parseConfigInput } from "~~/services/notifications/configInput";
import {
  deleteConfigs,
  findConfigForMarket,
  findConfigsForUser,
  rowMarketKey,
  rowToConfig,
  saveConfig,
  toConfigRow,
  userIdForms,
} from "~~/services/notifications/configRepository";

type ConfigBody = ConfigInput & { userId?: unknown; chainId?: unknown; market?: unknown };

const INVALID_MARKET = "Invalid market: expected v3 or a lowercased Aave V4 Spoke address";

/** The market in a query string or body: "v3" when absent, null when it is not a market id. */
const parseMarket = (raw: unknown): MarketId | null => {
  if (raw === undefined || raw === null || raw === "") return V3_MARKET_ID;
  return isMarketId(raw) ? raw : null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseUserId(searchParams.get("userId"));
    if (!userId) return jsonError(MISSING_USER_ID, 400);

    const chainId = parseChainId(searchParams.get("chainId"));
    if (chainId === null) return jsonError("Invalid chainId", 400);
    const market = parseMarket(searchParams.get("market"));
    if (market === null) return jsonError(INVALID_MARKET, 400);

    // No access check on reads, so an existing config stays visible after access expires; PUT/DELETE require it.
    // The Telegram link is per user, not per market, and is read from /api/telegram/link.
    const forms = userIdForms(userId);

    if (chainId !== undefined) {
      const row = await findConfigForMarket(forms, { chainId, market });
      return NextResponse.json(row ? rowToConfig(row) : null);
    }

    // Every config of the user, keyed by marketKey(chainId, market): "1:v3", "1:0x94e7...".
    const rows = await findConfigsForUser(forms);
    return NextResponse.json(Object.fromEntries(rows.map(row => [rowMarketKey(row), rowToConfig(row)])));
  } catch (e) {
    // Also answers failed Supabase reads, which the repository throws.
    return internalError(e);
  }
}

export async function PUT(request: Request) {
  try {
    const { userId: rawUserId, chainId, market: rawMarket, ...input }: ConfigBody = await readJsonObject(request);

    const userId = parseUserId(rawUserId);
    if (!userId) return jsonError(MISSING_USER_ID, 400);
    // chainId = the Aave network this config is for (position chain), NOT the wallet's connected chain
    if (!isChainId(chainId)) return jsonError("Missing or invalid chainId", 400);
    const market = parseMarket(rawMarket);
    if (market === null) return jsonError(INVALID_MARKET, 400);
    // A V4 Spoke must be one the cron reads. A V3 chain id stays unchecked, as before V4.
    if (market !== V3_MARKET_ID && !resolveMarket(chainId, market)) return jsonError("Unknown Aave V4 Spoke", 400);

    const parsed = parseConfigInput(input);
    if ("error" in parsed) return jsonError(parsed.error, 400);

    const denied = await requireActiveAccess(userId, "Active paid access required to update notification config");
    if (denied) return denied;

    const forms = userIdForms(userId);
    const error = await saveConfig(forms, toConfigRow(forms.normalized, { chainId, market }, parsed.value));
    if (error) return jsonError(error.message, 502);

    return NextResponse.json({ success: true });
  } catch (e) {
    return internalError(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId: rawUserId, chainId, market: rawMarket }: ConfigBody = await readJsonObject(request);

    const userId = parseUserId(rawUserId);
    if (!userId) return jsonError(MISSING_USER_ID, 400);
    if (!isChainId(chainId)) return jsonError("Missing or invalid chainId", 400);
    // Not checked against the Spokes the app reads, so a config for a Spoke it no longer lists can still be deleted.
    const market = parseMarket(rawMarket);
    if (market === null) return jsonError(INVALID_MARKET, 400);

    const denied = await requireActiveAccess(userId, "Active paid access required to delete notification config");
    if (denied) return denied;

    // Deletes both user id forms, so the row goes whether it was stored checksummed or lowercase.
    const forms = userIdForms(userId);
    const error = await deleteConfigs(forms, { chainId, market });
    if (error) return jsonError(error.message, 502);

    return NextResponse.json({ success: true });
  } catch (e) {
    return internalError(e);
  }
}
