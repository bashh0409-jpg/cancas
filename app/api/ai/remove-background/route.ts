import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import {
  consumeUserCredits,
  addUserCredits,
  getUserCredits,
} from "@/lib/credits/repository";
import {
  IdempotencyKeyError,
  requireIdempotencyKey,
  userScopedIdempotencyKey,
} from "@/lib/idempotency";

const REMOVE_BG_CREDIT_COST = 4;

const REMOVE_BG_TIMEOUT_MS = 30_000;

export async function POST(request: NextRequest) {
  let supabase: any;
  let user: any;
  let operationSucceeded = false;

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.REMOVE_BACKGROUND_KEY;

    if (!apiKey) {
      console.error(
        "[Remove Background] REMOVE_BACKGROUND_KEY is not configured on the server",
      );
      return NextResponse.json(
        {
          error:
            "Remove background is not configured. Please set REMOVE_BACKGROUND_KEY in the server environment.",
        },
        { status: 503 },
      );
    }

    // Validate file size (max 25MB for remove.bg free tier)
    if (imageFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 25MB" },
        { status: 400 },
      );
    }

    // Charge user credits for remove-background
    supabase = await createClient();
    user = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawIdempotencyKey = formData.get("idempotencyKey");
    const idempotencyKey = userScopedIdempotencyKey(
      user.id,
      requireIdempotencyKey(rawIdempotencyKey),
    );

    const charged = await consumeUserCredits(
      supabase,
      user.id,
      REMOVE_BG_CREDIT_COST,
      idempotencyKey,
      "credits.consume.remove_background",
    );

    if (!charged) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }


    const removeBgFormData = new FormData();
    removeBgFormData.append("image_file", imageFile);
    removeBgFormData.append("size", "auto");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REMOVE_BG_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: removeBgFormData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Remove Background Error]", response.status, errorText);
      // Refund credits on failure
      try {
        await addUserCredits(supabase, user.id, REMOVE_BG_CREDIT_COST);
      } catch (refundErr) {
        console.error("[Remove Background] Failed to refund credits:", refundErr);
      }

      return NextResponse.json(
        {
          error: `Remove background failed: ${response.statusText}`,
          detail: errorText,
        },
        { status: response.status },
      );
    }

    // remove.bg returns the processed image as binary
    const imageBuffer = await response.arrayBuffer();

    operationSucceeded = true;

    // Attach remaining credits header
    let remaining = undefined;
    try {
      remaining = await getUserCredits(supabase, user.id);
    } catch (err) {
      // ignore
    }

    const headers: Record<string, string> = {
      "Content-Type": "image/png",
      "Content-Length": imageBuffer.byteLength.toString(),
    };

    if (typeof remaining === "number") headers["X-Credits-Remaining"] = String(remaining);

    return new NextResponse(imageBuffer, { headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Remove Background Route Error]", message);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Remove background request timed out. Please try again." },
        { status: 504 },
      );
    }
    // If we charged but hit an unexpected error, attempt to refund
    try {
      if (typeof operationSucceeded === "boolean" && !operationSucceeded && user) {
        await addUserCredits(supabase, user.id, REMOVE_BG_CREDIT_COST);
      }
    } catch (refundErr) {
      console.error("[Remove Background] Failed to refund credits after error:", refundErr);
    }

    return NextResponse.json(
      { error: `Failed to remove background: ${message}` },
      { status: 500 },
    );
  }
}