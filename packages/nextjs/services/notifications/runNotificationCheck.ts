import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { getHealthFactorForWallet } from "~~/services/aave/getHealthFactor";
import { sendEmail } from "~~/services/email/sendEmail";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";

/** Cron interval in minutes (used in response; schedule is in vercel.json). */
export const CRON_INTERVAL_MINUTES = 5;

export interface NotificationCheckResult {
  success: true;
  CRON_INTERVAL_MINUTES: number;
  configsChecked: number;
  emailsSent: number;
  errors?: string[];
}

/**
 * Fetches enabled email notification configs, checks Aave health factor per wallet/chain,
 * and sends alert emails when health factor is below threshold.
 */
export async function runNotificationCheck(): Promise<NotificationCheckResult | { success: false; error: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("notification_configs")
      .select("user_id, chain_id, health_factor_threshold, email, services")
      .eq("enabled", true)
      .not("email", "is", null);

    if (error) {
      return { success: false, error: error.message };
    }

    const configs = (rows ?? []).filter(
      row => row.email?.trim() && Array.isArray(row.services) && (row.services as string[]).includes("email"),
    );

    let sent = 0;
    const errors: string[] = [];

    for (const config of configs) {
      const userId = config.user_id as string;
      const chainId = config.chain_id as number;
      const threshold = Number(config.health_factor_threshold) || DEFAULT_HEALTH_FACTOR_THRESHOLD;
      const email = String(config.email).trim();

      const result = await getHealthFactorForWallet(userId as `0x${string}`, chainId);
      if (!result) continue;

      const hfNum = result.healthFactor === "∞" ? Infinity : parseFloat(result.healthFactor);
      if (Number.isNaN(hfNum) || hfNum >= threshold) continue;

      const subject = `Aave Health Factor Alert – ${result.chainName}`;
      const text = `Your Aave Health Factor on ${result.chainName} is ${result.healthFactor}, which is below your threshold of ${threshold}. Consider adding collateral or repaying debt to avoid liquidation.`;
      const html = `<p>Your Aave Health Factor on <strong>${result.chainName}</strong> is <strong>${result.healthFactor}</strong>, which is below your threshold of <strong>${threshold}</strong>.</p><p>Consider adding collateral or repaying debt to avoid liquidation.</p>`;

      const sendResult = await sendEmail({ to: email, subject, text, html });
      if (sendResult.success) sent++;
      else errors.push(`${email}: ${sendResult.error}`);
    }

    return {
      success: true,
      CRON_INTERVAL_MINUTES,
      configsChecked: configs.length,
      emailsSent: sent,
      ...(errors.length > 0 && { errors }),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: message };
  }
}
