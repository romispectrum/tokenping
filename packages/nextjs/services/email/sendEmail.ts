import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Send an email via Resend. Returns { success: true, id } or { success: false, error }.
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ success: true; id?: string } | { success: false; error: string }> {
  const { to, subject, text, html } = options;
  const trimmedTo = to.trim();

  if (!trimmedTo || !emailRegex.test(trimmedTo)) {
    return { success: false, error: "Invalid email address" };
  }

  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "Email service not configured (RESEND_API_KEY missing)" };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "Decall <onboarding@resend.dev>";
  const subjectLine = subject ?? "Notification";
  const htmlContent = html ?? (text ? undefined : "<p>No content.</p>");
  const textContent = text ?? (html ? undefined : "No content.");

  const base = { from, to: [trimmedTo] as string[], subject: subjectLine };
  const { data, error } = await resend.emails.send(
    htmlContent !== undefined
      ? { ...base, html: htmlContent, ...(textContent !== undefined && { text: textContent }) }
      : { ...base, text: textContent as string },
  );

  if (error) {
    return { success: false, error: error.message ?? "Failed to send email" };
  }
  return { success: true, id: data?.id };
}
