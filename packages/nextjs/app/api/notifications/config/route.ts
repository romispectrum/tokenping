import { NextResponse } from "next/server";
import { V3_MARKET_ID, resolveMarket } from "~~/config/aaveConfig";
import { requireActiveAccess } from "~~/services/api/server/access";
import {
  internalError,
  isChainId,
  jsonError,
  parseChainId,
  readJsonObject,
  rejectCrossSiteRequest,
} from "~~/services/api/server/http";
import { INVALID_MARKET, parseMarket } from "~~/services/api/server/market";
import { requireSessionWallet } from "~~/services/api/server/session";
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

// Every handler acts for the signed-in wallet (the session cookie), never for a wallet named in the request. A
// `userId` an older client still sends must name that same wallet, or the request is refused (403).
type ConfigBody = ConfigInput & { userId?: unknown; chainId?: unknown; market?: unknown };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = requireSessionWallet(request, searchParams.get("userId"));
    if (session.response) return session.response;
    const userId = session.wallet;

    const chainId = parseChainId(searchParams.get("chainId"));
    if (chainId === null) return jsonError("Invalid chainId", 400);
    const market = parseMarket(searchParams.get("market"));
    if (market === null) return jsonError(INVALID_MARKET, 400);

    // No access check on reads, so an existing config stays visible after access expires; PUT/DELETE require it.
    // A config carries its Telegram username; whether it has pressed Start is read from /api/telegram/status.
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
    const refused = rejectCrossSiteRequest(request);
    if (refused) return refused;
    const { userId: claimedUserId, chainId, market: rawMarket, ...input }: ConfigBody = await readJsonObject(request);

    const session = requireSessionWallet(request, claimedUserId);
    if (session.response) return session.response;
    const userId = session.wallet;
    // chainId = the Aave network this config is for (position chain), NOT the wallet's connected chain
    if (!isChainId(chainId)) return jsonError("Missing or invalid chainId", 400);
    const market = parseMarket(rawMarket);
    if (market === null) return jsonError(INVALID_MARKET, 400);
    // A market named by address must be one the cron reads. A chain's main V3 market stays unchecked, as before.
    if (market !== V3_MARKET_ID && !resolveMarket(chainId, market)) return jsonError("Unknown Aave market", 400);

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
    const refused = rejectCrossSiteRequest(request);
    if (refused) return refused;
    const { userId: claimedUserId, chainId, market: rawMarket }: ConfigBody = await readJsonObject(request);

    const session = requireSessionWallet(request, claimedUserId);
    if (session.response) return session.response;
    const userId = session.wallet;
    if (!isChainId(chainId)) return jsonError("Missing or invalid chainId", 400);
    // Not checked against the markets the app reads, so a config for a market it no longer lists can still be deleted.
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
