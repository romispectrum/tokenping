/**
 * GET  /api/notifications/test?userId=0x...: when each channel's next test message is allowed, as
 *      `{ email, signal, telegram }`, each an ISO time or null when a test can be sent now.
 * POST /api/notifications/test { userId, chainId, market, channel }: sends one test message on `channel` for the
 *      saved alert in that market, with the alert as saved and the position as it is right now, in the language
 *      the alert uses for that channel.
 *
 * The recipient always comes from the saved alert, never from the request, so the button cannot be used to message
 * an arbitrary address. One test per wallet and channel every TEST_SEND_COOLDOWN_MINUTES, enforced by the database
 * (claim_notification_test_send). The slot is claimed before anything else; when the send fails it is given back,
 * so a broken channel can be tried again at once.
 *
 * Responses: 200 { sentAt, retryAt }; 400 bad input or a channel the alert does not use; 403 without active access;
 * 404 no saved alert for that market; 409 a Telegram username that has not pressed Start; 429 { error, retryAt };
 * 502 the provider refused the message. A 500 or 502 carries a generic message: the provider's or the database's
 * reason can name the relay, its settings or a table, so it goes to the server log only.
 */
import { NextResponse } from "next/server";
import type { Address } from "viem";
import { marketLabel, resolveMarket } from "~~/config/aaveConfig";
import { getTelegramBotUsername } from "~~/constants/notifications";
import { getMarketSnapshot } from "~~/services/aave/getHealthFactor";
import { requireActiveAccess } from "~~/services/api/server/access";
import {
  MISSING_USER_ID,
  internalError,
  isChainId,
  jsonError,
  parseUserId,
  readJsonObject,
} from "~~/services/api/server/http";
import { INVALID_MARKET, parseMarket } from "~~/services/api/server/market";
import {
  type NotificationConfigRow,
  findConfigForMarket,
  rowChannelLocale,
  userIdForms,
} from "~~/services/notifications/configRepository";
import { ALERT_SENDERS } from "~~/services/notifications/runNotificationCheck";
import { buildTestMessage } from "~~/services/notifications/testMessage";
import { claimTestSend, getTestSendRetryTimes, releaseTestSend } from "~~/services/notifications/testSends";
import { getChatIdByUsername } from "~~/services/telegram/telegramChats";
import type { NotificationService } from "~~/types/notifications";
import { normalizeThreshold } from "~~/utils/notifications/threshold";
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

export async function GET(request: Request) {
  try {
    const userId = parseUserId(new URL(request.url).searchParams.get("userId"));
    if (!userId) return jsonError(MISSING_USER_ID, 400);
    // No access check, like the config read: it only says when each button can be used again.
    return NextResponse.json(await getTestSendRetryTimes(userId), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return internalError("GET /api/notifications/test", e, "Could not read the test message limit");
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const userId = parseUserId(body.userId);
    if (!userId) return jsonError(MISSING_USER_ID, 400);
    if (!isChainId(body.chainId)) return jsonError("Missing or invalid chainId", 400);
    const market = parseMarket(body.market);
    if (market === null) return jsonError(INVALID_MARKET, 400);
    const channel = body.channel;
    if (!isNotificationService(channel)) return jsonError("Invalid channel: expected email, signal or telegram", 400);
    const chainId = body.chainId;

    const denied = await requireActiveAccess(userId, "Active paid access required to send a test message");
    if (denied) return denied;

    const config = await findConfigForMarket(userIdForms(userId), { chainId, market });
    if (!config) return jsonError("No saved alert for this market", 404);
    if (!(config.services ?? []).includes(channel)) return jsonError(`This alert does not send by ${channel}`, 400);

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
      const locale = rowChannelLocale(config, channel);
      const known = resolveMarket(chainId, market);
      const message = buildTestMessage({
        // The name when the position read fails (the snapshot names the market otherwise).
        chainName: known ? marketLabel(known) : `chain ${chainId}`,
        snapshot: await getMarketSnapshot(config.user_id as Address, chainId, market),
        threshold: normalizeThreshold(config.health_factor_threshold),
        locale,
      });
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
