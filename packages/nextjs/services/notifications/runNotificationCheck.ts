import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { getHealthFactorForWallet } from "~~/services/aave/getHealthFactor";
import { sendEmail } from "~~/services/email/sendEmail";
import { sendSignalMessage } from "~~/services/signal/sendSignal";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";
import { sendTelegramMessage } from "~~/services/telegram/sendTelegram";
import { deleteLinkByChatId } from "~~/services/telegram/telegramLinks";

/** Cron interval in minutes (used in response; schedule is in vercel.json). */
export const CRON_INTERVAL_MINUTES = 5;

export interface NotificationCheckResult {
  success: true;
  CRON_INTERVAL_MINUTES: number;
  configsChecked: number;
  emailsSent: number;
  signalSent: number;
  telegramSent: number;
  errors?: string[];
}

/**
 * Fetches enabled notification configs, checks Aave health factor per wallet/chain,
 * and sends alert emails and/or Signal messages when health factor is below threshold.
 */
export async function runNotificationCheck(): Promise<NotificationCheckResult | { success: false; error: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("notification_configs")
      .select("user_id, chain_id, health_factor_threshold, email, signal_recipient, services")
      .eq("enabled", true);

    if (error) {
      return { success: false, error: error.message };
    }

    // Pull all Telegram links in one query and index by user_id. Cheaper than per-row joins.
    const { data: linkRows } = await supabase.from("user_telegram_links").select("user_id, chat_id");
    const telegramChatByUser = new Map<string, string>();
    for (const row of linkRows ?? []) {
      telegramChatByUser.set(String(row.user_id), String(row.chat_id));
    }

    const configs = (rows ?? []).filter(row => {
      const services = row.services as string[];
      if (!Array.isArray(services) || services.length === 0) return false;
      const wantsEmail = services.includes("email") && row.email?.trim();
      const wantsSignal = services.includes("signal") && row.signal_recipient?.trim();
      const wantsTelegram = services.includes("telegram") && telegramChatByUser.has(String(row.user_id));
      return wantsEmail || wantsSignal || wantsTelegram;
    });

    let emailsSent = 0;
    let signalSent = 0;
    let telegramSent = 0;
    const errors: string[] = [];

    for (const config of configs) {
      const userId = config.user_id as string;
      const chainId = config.chain_id as number;
      const threshold = Number(config.health_factor_threshold) || DEFAULT_HEALTH_FACTOR_THRESHOLD;
      const services = config.services as string[];

      const result = await getHealthFactorForWallet(userId as `0x${string}`, chainId);
      if (!result) continue;

      const hfNum = result.healthFactor === "∞" ? Infinity : parseFloat(result.healthFactor);
      if (Number.isNaN(hfNum) || hfNum >= threshold) continue;

      // Use UTC so timestamp is always server time (Vercel runs in UTC)
      const timestamp = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "long",
      }).format(new Date());

      const alertText =
        `Your Aave Health Factor on ${result.chainName} is ${result.healthFactor}, ` +
        `which is below your threshold of ${threshold}. ` +
        `Consider adding collateral or repaying debt to avoid liquidation.\n\nSent at: ${timestamp}`;

      // Email notification
      if (services.includes("email") && config.email?.trim()) {
        const email = String(config.email).trim();
        const subject = `Aave Health Factor Alert – ${result.chainName}`;
        const html =
          `<p>Your Aave Health Factor on <strong>${result.chainName}</strong> is ` +
          `<strong>${result.healthFactor}</strong>, which is below your threshold of ` +
          `<strong>${threshold}</strong>.</p>` +
          `<p>Consider adding collateral or repaying debt to avoid liquidation.</p>` +
          `<p><small>Created at: ${timestamp}</small></p>`;

        const sendResult = await sendEmail({ to: email, subject, text: alertText, html });
        if (sendResult.success) emailsSent++;
        else errors.push(`email:${email}: ${sendResult.error}`);
      }

      // Signal notification
      if (services.includes("signal") && config.signal_recipient?.trim()) {
        const username = String(config.signal_recipient).trim();
        const sendResult = await sendSignalMessage({ to: username, message: alertText });
        if (sendResult.success) signalSent++;
        else errors.push(`signal:${username}: ${sendResult.error}`);
      }

      // Telegram notification — chat_id comes from the user-level link, not per-chain.
      if (services.includes("telegram")) {
        const chatId = telegramChatByUser.get(String(userId));
        if (chatId) {
          const sendResult = await sendTelegramMessage({ chatId, message: alertText });
          if (sendResult.success) {
            telegramSent++;
          } else {
            errors.push(`telegram:${chatId}: ${sendResult.error}`);
            // Self-heal: if the bot has been blocked or the chat is gone, drop the
            // link so we don't keep erroring every 5 minutes. Once nulled, the user
            // can re-link from the UI.
            if (sendResult.code === "bot_blocked" || sendResult.code === "chat_not_found") {
              await deleteLinkByChatId(chatId);
              telegramChatByUser.delete(String(userId));
            }
          }
        }
      }
    }

    return {
      success: true,
      CRON_INTERVAL_MINUTES,
      configsChecked: configs.length,
      emailsSent,
      signalSent,
      telegramSent,
      ...(errors.length > 0 && { errors }),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: message };
  }
}
