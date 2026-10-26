import { NextResponse } from "next/server";
import type { Hex } from "viem";
import { type MarketRef, resolveMarket } from "~~/config/aaveConfig";
import { type MorphoChain, getMorphoChain } from "~~/config/morpho";
import { type MorphoProtocol, isMorphoProtocol } from "~~/config/protocols";
import { requireActiveAccess } from "~~/services/api/server/access";
import {
  internalError,
  isChainId,
  jsonError,
  parseChainId,
  readJsonObject,
  rejectCrossSiteRequest,
} from "~~/services/api/server/http";
import { parseAlertMarket } from "~~/services/api/server/market";
import { requireSessionWallet } from "~~/services/api/server/session";
import { MorphoApiError } from "~~/services/morpho/api";
import { createMorphoClient } from "~~/services/morpho/client";
import { readListedMarketParams, refreshMarketParams } from "~~/services/morpho/params";
import { isStoredMarketParams } from "~~/services/morpho/storedParams";
import type { MorphoMarketParams } from "~~/services/morpho/types";
import { type ConfigInput, parseConfigInput } from "~~/services/notifications/configInput";
import {
  type ConfigWriteRow,
  MAX_CONFIGS_PER_WALLET,
  type UserIdForms,
  deleteConfigs,
  findConfigForMarket,
  findConfigsForUser,
  rowMarketKey,
  rowToConfig,
  saveConfig,
  toConfigRow,
  toMorphoConfigRow,
  userIdForms,
} from "~~/services/notifications/configRepository";
import { thresholdRangeFor } from "~~/utils/notifications/threshold";

// Every handler acts for the signed-in wallet (the session cookie), never for a wallet named in the request. A
// `userId` an older client still sends must name that same wallet, or the request is refused (403). `protocol` is
// absent (Aave) from every request made before Morpho, and Aave requests take the path they always took.
type ConfigBody = ConfigInput & { userId?: unknown; chainId?: unknown; protocol?: unknown; market?: unknown };

type MorphoRef = MarketRef & { protocol: MorphoProtocol };

const isMorphoRef = (ref: MarketRef): ref is MorphoRef => isMorphoProtocol(ref.protocol);

/** The Morpho chain a ref's alert reads, when Tokenping covers that protocol there. */
const morphoChainFor = ({ protocol, chainId }: MorphoRef) => {
  const chain = getMorphoChain(chainId);
  return protocol === "morpho-midnight" && !chain?.midnight ? undefined : chain;
};

/**
 * The market parameters a Morpho alert is saved with. An existing alert keeps working whatever Morpho's API says (it is
 * only brought up to date when the API answers). A new one needs a market Morpho's app lists and the chain has: a
 * market nobody could verify is refused, never saved.
 */
const morphoMarketParams = async (
  forms: UserIdForms,
  ref: MorphoRef,
  chain: MorphoChain,
): Promise<{ params: MorphoMarketParams } | { response: Response }> => {
  const client = createMorphoClient(chain.chain);
  const marketId = ref.market as Hex;
  const existing = await findConfigForMarket(forms, ref);
  if (existing && isStoredMarketParams(ref.protocol, existing.market_params)) {
    const refreshed = await refreshMarketParams(client, chain, marketId, existing.market_params);
    return { params: isStoredMarketParams(ref.protocol, refreshed) ? refreshed : existing.market_params };
  }

  if (ref.protocol === "morpho-midnight" && !chain.midnightListed) {
    return { response: jsonError("Unknown Morpho market", 400) };
  }
  try {
    const params = await readListedMarketParams(client, chain, ref.protocol, marketId);
    // Checked as the cron will read it back: a market it could not read (a Midnight market without collateral, say)
    // is refused now rather than saved as an alert that never fires.
    return params && isStoredMarketParams(ref.protocol, params)
      ? { params }
      : { response: jsonError("Unknown Morpho market", 400) };
  } catch (e) {
    if (!(e instanceof MorphoApiError)) throw e;
    console.error("PUT /api/notifications/config: Morpho API unavailable", e.message);
    return { response: jsonError("Could not verify the Morpho market. Please try again later.", 503) };
  }
};

/** Code and message only: a constraint violation's `details` repeat the row, with its email and usernames. */
const logDatabaseError = (logPrefix: string, { code, message }: { code?: string; message: string }) =>
  console.error(`${logPrefix}: database error`, { code, message });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = requireSessionWallet(request, searchParams.get("userId"));
    if (session.response) return session.response;
    const userId = session.wallet;

    const chainId = parseChainId(searchParams.get("chainId"));
    if (chainId === null) return jsonError("Invalid chainId", 400);
    // Checked even when chainId is absent and the whole list is returned.
    const market = parseAlertMarket(searchParams.get("protocol"), searchParams.get("market"));
    if ("error" in market) return jsonError(market.error, 400);

    // No access check on reads, so an existing config stays visible after access expires; PUT/DELETE require it.
    // A config carries its Telegram username; whether it has pressed Start is read from /api/telegram/status.
    const forms = userIdForms(userId);

    if (chainId !== undefined) {
      const row = await findConfigForMarket(forms, { chainId, ...market });
      return NextResponse.json(row ? rowToConfig(row) : null);
    }

    // Every config of the user, keyed by marketRefKey: "1:v3", "1:0x94e7...", "morpho-blue:8453:0x3a85...".
    const rows = await findConfigsForUser(forms);
    const entries = rows.flatMap(row => {
      const key = rowMarketKey(row);
      if (key) return [[key, rowToConfig(row)]];
      console.error("GET /api/notifications/config: skipped an alert whose market cannot be read", {
        id: row.id,
        protocol: row.protocol,
      });
      return [];
    });
    return NextResponse.json(Object.fromEntries(entries));
  } catch (e) {
    // Also answers failed Supabase reads, which the repository throws.
    return internalError("GET /api/notifications/config", e, "Could not load your alerts. Please try again.");
  }
}

export async function PUT(request: Request) {
  try {
    const refused = rejectCrossSiteRequest(request);
    if (refused) return refused;
    const {
      userId: claimedUserId,
      chainId,
      protocol: rawProtocol,
      market: rawMarket,
      ...input
    }: ConfigBody = await readJsonObject(request);

    const session = requireSessionWallet(request, claimedUserId);
    if (session.response) return session.response;
    const userId = session.wallet;
    // chainId = the network of the position this config is for, NOT the wallet's connected chain
    if (!isChainId(chainId)) return jsonError("Missing or invalid chainId", 400);
    const market = parseAlertMarket(rawProtocol, rawMarket);
    if ("error" in market) return jsonError(market.error, 400);
    const ref: MarketRef = { chainId, ...market };
    // Only a market the cron reads, a chain's main V3 market included: an alert anywhere else could never fire.
    const morphoChain = isMorphoRef(ref) ? morphoChainFor(ref) : undefined;
    if (isMorphoRef(ref) && !morphoChain) return jsonError("Unknown Morpho market", 400);
    if (!isMorphoRef(ref) && !resolveMarket(chainId, ref.market)) return jsonError("Unknown Aave market", 400);

    const parsed = parseConfigInput(input, thresholdRangeFor(ref.protocol));
    if ("error" in parsed) return jsonError(parsed.error, 400);

    const denied = await requireActiveAccess(userId, "Active paid access required to update notification config");
    if (denied) return denied;

    const forms = userIdForms(userId);
    let row: ConfigWriteRow = toConfigRow(forms.normalized, ref, parsed.value);
    if (isMorphoRef(ref) && morphoChain) {
      const params = await morphoMarketParams(forms, ref, morphoChain);
      if ("response" in params) return params.response;
      row = toMorphoConfigRow(forms.normalized, ref, parsed.value, params.params);
    }
    const saved = await saveConfig(forms, row);
    if (saved.status === "limit") {
      return jsonError(
        `A wallet can have up to ${MAX_CONFIGS_PER_WALLET} alerts. Delete one before adding another.`,
        409,
      );
    }
    if (saved.status === "failed") {
      logDatabaseError("PUT /api/notifications/config", saved.error);
      return jsonError("Could not save the alert. Please try again.", 502);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return internalError("PUT /api/notifications/config", e, "Could not save the alert. Please try again.");
  }
}

export async function DELETE(request: Request) {
  try {
    const refused = rejectCrossSiteRequest(request);
    if (refused) return refused;
    const {
      userId: claimedUserId,
      chainId,
      protocol: rawProtocol,
      market: rawMarket,
    }: ConfigBody = await readJsonObject(request);

    const session = requireSessionWallet(request, claimedUserId);
    if (session.response) return session.response;
    const userId = session.wallet;
    if (!isChainId(chainId)) return jsonError("Missing or invalid chainId", 400);
    // Not checked against the markets the app reads, nor against Morpho's flag or API, so a config for a market it no
    // longer lists can still be deleted.
    const market = parseAlertMarket(rawProtocol, rawMarket);
    if ("error" in market) return jsonError(market.error, 400);

    const denied = await requireActiveAccess(userId, "Active paid access required to delete notification config");
    if (denied) return denied;

    // Deletes both user id forms, so the row goes whether it was stored checksummed or lowercase.
    const forms = userIdForms(userId);
    const error = await deleteConfigs(forms, { chainId, ...market });
    if (error) {
      logDatabaseError("DELETE /api/notifications/config", error);
      return jsonError("Could not delete the alert. Please try again.", 502);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return internalError("DELETE /api/notifications/config", e, "Could not delete the alert. Please try again.");
  }
}
