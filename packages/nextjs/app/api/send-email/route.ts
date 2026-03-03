import { NextResponse } from "next/server";
import { isEmailConfigured, sendEmail } from "~~/services/email/sendEmail";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, text, html } = body as {
      to?: string;
      subject?: string;
      text?: string;
      html?: string;
    };

    if (!to || typeof to !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'to' email address" }, { status: 400 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "Email service not configured (RESEND_API_KEY missing)" }, { status: 503 });
    }

    const result = await sendEmail({
      to,
      subject: subject ?? "Notification",
      text,
      html,
    });

    if (!result.success) {
      const status = result.error.includes("not configured") ? 503 : 502;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Email sent successfully",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
