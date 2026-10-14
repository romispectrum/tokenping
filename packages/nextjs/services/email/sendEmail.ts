import { Resend } from "resend";
import "server-only";
import { isValidEmail } from "~~/utils/notifications/validation";

// BUG(B3.0): created at module load, and the SDK throws when RESEND_API_KEY is unset, so importing this module fails.
const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM = "Tokenping <onboarding@resend.dev>";
const NO_CONTENT_HTML = "<p>No content.</p>";
const NO_CONTENT_TEXT = "No content.";

/** text / html may be null: /api/send-email forwards unvalidated JSON. */
export type SendEmailOptions = {
  to: string;
  subject: string;
  text?: string | null;
  html?: string | null;
};

type EmailBody = { html: string; text?: string } | { text: string };

/** Resend needs html or text; a missing (null or undefined) part gets a placeholder only when the other is falsy. */
export const buildEmailBody = (text?: string | null, html?: string | null): EmailBody => {
  if (html == null) return text ? { text } : { html: NO_CONTENT_HTML, text: text ?? NO_CONTENT_TEXT };
  if (text != null) return { html, text };
  return html ? { html } : { html, text: NO_CONTENT_TEXT };
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailOptions): Promise<{ success: true; id?: string } | { success: false; error: string }> {
  const trimmedTo = to.trim();

  if (!isValidEmail(trimmedTo)) {
    return { success: false, error: "Invalid email address" };
  }

  if (!isEmailConfigured()) {
    return { success: false, error: "Email service not configured (RESEND_API_KEY missing)" };
  }

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: [trimmedTo],
    subject,
    ...buildEmailBody(text, html),
  });

  if (error) {
    return { success: false, error: error.message ?? "Failed to send email" };
  }
  return { success: true, id: data?.id };
}
