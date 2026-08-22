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
  <head>
    <meta charset="utf-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Geist+Mono:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="margin:0;padding:0;background:#ffffff;font-family:'Geist Mono','Courier New',Courier,monospace;color:#000000;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:48px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:420px;">
            <tr>
              <td align="center" style="padding:0 24px;">
                <p style="margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-0.02em;text-transform:uppercase;color:#000000;">
                  Verification Code
                </p>

                <p style="margin:0 0 24px;font-size:14px;line-height:22px;letter-spacing:-0.01em;text-transform:uppercase;color:rgba(0,0,0,0.6);">
                  Use this code to confirm your account request. It expires in
                  <span style="color:#000000;">15 minutes</span>.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
                  <tr>
                    <td style="background:rgba(0,0,0,0.06);border-radius:9999px;font-family:Arial, Helvetica, sans-serif;padding:12px 32px;font-size:28px;font-weight:700;letter-spacing:6px;color:#000000;">
                      ${code}
                    </td>
                  </tr>
                </table>

                <p style="margin:0;font-size:12px;line-height:20px;letter-spacing:-0.01em;text-transform:uppercase;color:rgba(0,0,0,0.4);">
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
        "Reflow verification code",
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
