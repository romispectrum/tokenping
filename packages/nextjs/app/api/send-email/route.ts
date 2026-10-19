import { NextResponse } from "next/server";
import { hasBearerSecret } from "~~/services/api/server/auth";
import { internalError, jsonError } from "~~/services/api/server/http";
import { isEmailConfigured, sendEmail } from "~~/services/email/sendEmail";

type SendEmailBody = {
  to?: unknown;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
};

/** Server-to-server only: without the CRON_SECRET bearer this would be an open email relay. */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return jsonError("Email relay is disabled: CRON_SECRET is not configured", 503);
  if (!hasBearerSecret(request, secret)) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const { to, subject, text, html } = body as SendEmailBody;

    if (!to || typeof to !== "string") {
      return jsonError("Missing or invalid 'to' email address", 400);
    }

    if (!isEmailConfigured()) {
      return jsonError("Email service not configured (RESEND_API_KEY missing)", 503);
    }

    const result = await sendEmail({ to, subject: subject ?? "Notification", text, html });

    if (!result.success) {
      // An invalid address is reported as 502, not 400.
      return jsonError(result.error, result.error.includes("not configured") ? 503 : 502);
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Email sent successfully",
    });
  } catch (e) {
    return internalError("POST /api/send-email", e);
  }
}
