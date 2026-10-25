/**
 * GET  /api/notifications/test: when each of the signed-in wallet's channels can send its next test message, as
 *      `{ email, signal, telegram }`, each an ISO time or null when a test can be sent now.
 * POST /api/notifications/test { chainId, market, protocol?, channel }: sends one test message on `channel` for the
 *      signed-in wallet's saved alert in that market (Aave's unless `protocol` names Morpho's), with the alert as saved
 *      and the position as it is right now, in the language the alert uses for that channel.
 *
 * Both act for the wallet of the session cookie (401 without one). A `userId` an older client still sends must name
 * that wallet (403 otherwise).
 *
 * The recipient always comes from the saved alert, never from the request, so the button cannot be used to message
 * an arbitrary address. One test per wallet and channel every TEST_SEND_COOLDOWN_MINUTES, enforced by the database
 * (claim_notification_test_send). The slot is claimed before anything else; when the send fails it is given back,
 * so a broken channel can be tried again at once.
 *
 * Responses: 200 { sentAt, retryAt }; 400 bad input or a channel the alert does not use; 401 not signed in; 403
 * cross-site or without active access; 404 no saved alert for that market; 409 a Telegram username that has not
 * pressed Start; 415 not JSON; 429 { error, retryAt }; 502 the provider refused the message. A 500 or 502 carries a
 * generic message: the provider's or the database's reason can name the relay, its settings or a table, so it goes
 * to the server log only.
 */
import { NextResponse } from "next/server";
import type { Address } from "viem";
import { type MarketRef, marketLabel, resolveMarket } from "~~/config/aaveConfig";
import { isMorphoProtocol } from "~~/config/protocols";
import { getTelegramBotUsername } from "~~/constants/notifications";
import { getMarketSnapshot } from "~~/services/aave/getHealthFactor";
import { requireActiveAccess } from "~~/services/api/server/access";
import {
  internalError,
  isChainId,
  jsonError,
  readJsonObject,
  rejectCrossSiteRequest,
} from "~~/services/api/server/http";
import { parseAlertMarket } from "~~/services/api/server/market";
import { requireSessionWallet } from "~~/services/api/server/session";
import { createMorphoClient } from "~~/services/morpho/client";
import {
  type NotificationConfigRow,
  findConfigForMarket,
  rowChannelLocale,
  userIdForms,
} from "~~/services/notifications/configRepository";
import { type MorphoAlert, readMorphoHealth, toMorphoAlert } from "~~/services/notifications/morphoAlerts";
import { buildMorphoTestMessage } from "~~/services/notifications/morphoMessages";
import { ALERT_SENDERS } from "~~/services/notifications/runNotificationCheck";
import { buildTestMessage } from "~~/services/notifications/testMessage";
import { claimTestSend, getTestSendRetryTimes, releaseTestSend } from "~~/services/notifications/testSends";
import { getChatIdByUsername } from "~~/services/telegram/telegramChats";
import type { NotificationService } from "~~/types/notifications";
import { MORPHO_THRESHOLD_RANGE, normalizeThreshold } from "~~/utils/notifications/threshold";
import { isNotificationService } from "~~/utils/notifications/validation";

type Recipient = { recipient: string } | { error: string; status: number };

const CHANNEL_NAMES: Record<NotificationService, string> = { email: "email", signal: "Signal", telegram: "Telegram" };

/** Where the saved alert sends `channel`: the stored address or username, and for Telegram the chat it started. */
const recipientFor = async (config: NotificationConfigRow, channel: NotificationService): Promise<Recipient> => {
  if (channel === "email") {
    const email = config.email?.trim();
    return email ? { recipient: email } : { error: "This alert has no email address saved", status: 400 };
  }
  if (channel === "signal") {
    const username = config.signal_recipient?.trim();
    return username ? { recipient: username } : { error: "This alert has no Signal username saved", status: 400 };
  }
  const username = config.telegram_username?.trim();
  if (!username) return { error: "This alert has no Telegram username saved", status: 400 };
  const chatId = await getChatIdByUsername(username);
  if (chatId) return { recipient: chatId };
  const bot = getTelegramBotUsername();
  return {
    error: `@${username} has not pressed Start in ${bot ? `@${bot}` : "the Tokenping bot"} yet`,
    status: 409,
  };
};

/** An Aave alert's test message, with the position as it is right now. */
const aaveTestMessage = async (
  { chainId, market }: MarketRef,
  config: NotificationConfigRow,
  channel: NotificationService,
) => {
  const known = resolveMarket(chainId, market);
  return buildTestMessage({
    // The name when the position read fails (the snapshot names the market otherwise).
    chainName: known ? marketLabel(known) : `chain ${chainId}`,
    snapshot: await getMarketSnapshot(config.user_id as Address, chainId, market),
    threshold: normalizeThreshold(config.health_factor_threshold),
    locale: rowChannelLocale(config, channel),
  });
};

/** A Morpho alert's test message, with the position read from the chain (one retry: someone is waiting for it). */
const morphoTestMessage = async (
  config: NotificationConfigRow,
  alert: MorphoAlert<NotificationConfigRow>,
  channel: NotificationService,
) => {
  const reading = await readMorphoHealth(
    createMorphoClient(alert.chain.chain, 1),
    alert,
    config.user_id as Address,
  ).catch(() => null);
  return buildMorphoTestMessage({
    chainName: alert.chain.name,
    params: alert.params,
    reading,
    threshold: normalizeThreshold(config.health_factor_threshold, MORPHO_THRESHOLD_RANGE),
    locale: rowChannelLocale(config, channel),
  });
};

export async function GET(request: Request) {
  try {
    const session = requireSessionWallet(request, new URL(request.url).searchParams.get("userId"));
    if (session.response) return session.response;
    // No access check, like the config read: it only says when each button can be used again.
    return NextResponse.json(await getTestSendRetryTimes(session.wallet), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return internalError("GET /api/notifications/test", e, "Could not read the test message limit");
  }
}

export async function POST(request: Request) {
  try {
    const refused = rejectCrossSiteRequest(request);
    if (refused) return refused;
    const body = await readJsonObject(request);
    const session = requireSessionWallet(request, body.userId);
    if (session.response) return session.response;
    const userId = session.wallet;
    if (!isChainId(body.chainId)) return jsonError("Missing or invalid chainId", 400);
    const market = parseAlertMarket(body.protocol, body.market);
    if ("error" in market) return jsonError(market.error, 400);
    const channel = body.channel;
    if (!isNotificationService(channel)) return jsonError("Invalid channel: expected email, signal or telegram", 400);
    const chainId = body.chainId;
    const ref: MarketRef = { chainId, ...market };

    const denied = await requireActiveAccess(userId, "Active paid access required to send a test message");
    if (denied) return denied;

    const config = await findConfigForMarket(userIdForms(userId), ref);
    if (!config) return jsonError("No saved alert for this market", 404);
    if (!(config.services ?? []).includes(channel)) return jsonError(`This alert does not send by ${channel}`, 400);
    const morpho = isMorphoProtocol(ref.protocol) ? toMorphoAlert(config) : undefined;
    if (morpho === null) throw new Error("The saved Morpho alert cannot be read");

    const target = await recipientFor(config, channel);
    if ("error" in target) return jsonError(target.error, target.status);

    // Claimed before the position is read, so a refused click costs no RPC call.
    const claim = await claimTestSend(userId, channel);
    if (!claim.claimed) {
      return NextResponse.json(
        { error: "One test message per channel every 15 minutes", retryAt: claim.retryAt },
        { status: 429 },
      );
    }

    try {
      const message = morpho
        ? await morphoTestMessage(config, morpho, channel)
        : await aaveTestMessage(ref, config, channel);
      const result = await ALERT_SENDERS[channel](target.recipient, message);
      if (!result.success) {
        console.error(`POST /api/notifications/test: the ${channel} provider refused the message`, result.error);
        await releaseTestSend(userId, channel, claim.sentAt);
        return jsonError(`Could not send the test message by ${CHANNEL_NAMES[channel]}. Please try again later.`, 502);
      }
    } catch (e) {
      await releaseTestSend(userId, channel, claim.sentAt);
      throw e;
    }

    return NextResponse.json({ sentAt: claim.sentAt, retryAt: claim.retryAt });
  } catch (e) {
    return internalError("POST /api/notifications/test", e, "Could not send the test message. Please try again.");
  }
}
