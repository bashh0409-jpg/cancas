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
  name,
}: {
  to: string;
  code: string;
  name: string;
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
  </head>
  <body style="margin:0;padding:0;background:#ffffff;color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:32px 0 48px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 78px;">
                  <tr>
                    <td>
                      <img src="https://www.swipes.site/images/Reb.svg" width="43" height="28" alt="Reflow" style="display:block;border:0;outline:none;text-decoration:none;filter:brightness(0);" />
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 32px;font-size:26px;line-height:34px;letter-spacing:-0.7px;">
                  Hello, <strong>${name}.</strong>
                </p>

                <p style="margin:0 0 32px;font-size:18px;line-height:28px;letter-spacing:-0.25px;">
                  Use the verification code below to confirm your account deletion request. It expires in 15 minutes.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 72px;">
                  <tr>
                    <td style="border-radius:1200px;padding:10px 15px;font-size:22px;line-height:28px;font-weight:700;letter-spacing:5px;color:#000000;">
                      ${code}
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 12px;padding-top:24px;border-top:1px solid #eaeaea;font-size:14px;line-height:22px;color:#737373;">
                  If you did not request this code, you can safely ignore this email.
                </p>
                <p style="margin:0;font-size:14px;line-height:22px;color:#737373;">
                  Reflow account security
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
      const displayName =
        (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
        user.email.split("@")[0];
      await sendDeletionCodeEmail({
        to: user.email,
        code,
        name: displayName,
      });
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
