import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type BrevoErrorResponse = {
  code?: string;
  message?: string;
};

class EmailDeliveryError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "EmailDeliveryError";
    this.status = status;
  }
}

async function sendDeletionCodeEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "CanvasAI";
  const replyToEmail = process.env.BREVO_REPLY_TO_EMAIL ?? senderEmail;

  if (!apiKey || !senderEmail) {
    throw new EmailDeliveryError(
      "Missing BREVO_API_KEY or BREVO_SENDER_EMAIL.",
      500,
    );
  }

  if (apiKey.startsWith("xsmtpsib-")) {
    throw new EmailDeliveryError(
      "BREVO_API_KEY is an SMTP key. Use a Brevo API key from Brevo Settings > SMTP & API > API Keys.",
      500,
    );
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },
      replyTo: {
        email: replyToEmail,
        name: senderName,
      },
      to: [{ email: to }],
      subject: "Your Reflow verification code",
      htmlContent: `
        <!doctype html>
        <html lang="en">
          <body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f7;padding:24px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
                    <tr>
                      <td style="padding:24px;">
                        <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">Your Reflow verification code</p>
                        <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#374151;">
                          Use this code to confirm your account request. It expires in 15 minutes.
                        </p>
                        <p style="margin:0 0 16px;font-size:28px;line-height:36px;letter-spacing:6px;font-weight:700;font-family:Courier New,monospace;color:#111827;">
                          ${code}
                        </p>
                        <p style="margin:0;font-size:13px;line-height:20px;color:#6b7280;">
                          If you did not request this code, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      textContent: [
        "Your Reflow verification code",
        "",
        `Code: ${code}`,
        "",
        "Use this code to confirm your account request. It expires in 15 minutes.",
        "If you did not request this code, you can safely ignore this email.",
      ].join("\n"),
      tags: ["account-verification"],
      headers: {
        "X-Entity-Ref-ID": `account-deletion-${Date.now()}`,
      },
    }),
  });

  if (!response.ok) {
    let detail = response.statusText;

    try {
      const errorBody = (await response.json()) as BrevoErrorResponse;
      detail = errorBody.message ?? errorBody.code ?? detail;
    } catch {
      // Keep the HTTP status text when Brevo does not return JSON.
    }

    throw new EmailDeliveryError(
      `Brevo email failed (${response.status}): ${detail}`,
    );
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "Your account does not have an email address." },
        { status: 400 },
      );
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the code with a 15-minute expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: storeError } = await supabase
      .from("account_deletion_codes")
      .upsert(
        {
          user_id: user.id,
          code: code,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

    if (storeError) {
      console.error("Failed to store deletion code:", storeError);
      return NextResponse.json(
        { error: `Failed to generate code: ${storeError.message}` },
        { status: 500 },
      );
    }

    try {
      await sendDeletionCodeEmail({ to: user.email, code });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      const message =
        emailError instanceof EmailDeliveryError
          ? emailError.message
          : "Failed to send verification email. Please try again.";
      const status =
        emailError instanceof EmailDeliveryError ? emailError.status : 502;

      return NextResponse.json(
        { error: message },
        { status },
      );
    }

    return NextResponse.json(
      { success: true, message: "Verification code sent to your email" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error requesting deletion code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
