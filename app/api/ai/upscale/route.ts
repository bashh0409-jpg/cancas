import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import {
  consumeUserCredits,
  addUserCredits,
  getUserCredits,
} from "@/lib/credits/repository";
import { OPERATION_COSTS } from "@/lib/credits/pricing";
import {
  IdempotencyKeyError,
  requireIdempotencyKey,
  userScopedIdempotencyKey,
} from "@/lib/idempotency";

export const maxDuration = 180;

const UPSCALE_CREDIT_COST = OPERATION_COSTS.UPSCALE;

const TOPAZ_SUBMIT_TIMEOUT_MS = 60_000;
const TOPAZ_POLL_INTERVAL_MS = 3_000;
const TOPAZ_MAX_POLLS = 40; // 40 * 3s = 120s max polling
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.TOPAZ_API_KEY;

    if (!apiKey) {
      console.error(
        "[Upscale] TOPAZ_API_KEY is not configured on the server",
      );
      return NextResponse.json(
        {
          error:
            "Topaz upscale is not configured. Please set TOPAZ_API_KEY in the server environment.",
        },
        { status: 503 },
      );
    }

    // Validate file size (max 50MB)
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 50MB" },
        { status: 400 },
      );
    }

    // Read optional dimensions + scale factor from the form
    const widthStr = formData.get("width");
    const heightStr = formData.get("height");
    const scaleStr = formData.get("scale");

    const width = typeof widthStr === "string" ? Number(widthStr) : undefined;
    const height =
      typeof heightStr === "string" ? Number(heightStr) : undefined;
    const scaleFactor =
      typeof scaleStr === "string" && Number(scaleStr) > 0
        ? Number(scaleStr)
        : 2;

    // Clamp scale factor to sane bounds (1x – 8x)
    const clampedScale = Math.min(8, Math.max(1, scaleFactor));

    const outputWidth =
      width && Number.isFinite(width) ? Math.round(width * clampedScale) : undefined;
    const outputHeight =
      height && Number.isFinite(height) ? Math.round(height * clampedScale) : undefined;

    // ── Step 0: Consume user credits for upscale ────────────────────────
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

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
      UPSCALE_CREDIT_COST,
      idempotencyKey,
      "credits.consume.upscale",
    );

    if (!charged) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    // Track whether the operation succeeded so we can refund on failure
    let operationSucceeded = false;

    try {
      // ── Step 1: Submit the enhance job to Topaz ─────────────────────────
      const topazFormData = new FormData();
      topazFormData.append("image", imageFile);
      topazFormData.append(
        "model",
        process.env.TOPAZ_IMAGE_MODEL ?? "Low Resolution V2",
      );
      topazFormData.append("output_format", "png");

      if (outputWidth) {
        topazFormData.append("output_width", String(outputWidth));
      }

      if (outputHeight) {
        topazFormData.append("output_height", String(outputHeight));
      }

      const submitController = new AbortController();
      const submitTimeout = setTimeout(
        () => submitController.abort(),
        TOPAZ_SUBMIT_TIMEOUT_MS,
      );

      let submitResponse: Response;
      try {
        submitResponse = await fetch(
          "https://api.topazlabs.com/image/v1/enhance/async",
          {
            method: "POST",
            headers: {
              "X-API-Key": apiKey,
            },
            body: topazFormData,
            signal: submitController.signal,
          },
        );
      } finally {
        clearTimeout(submitTimeout);
      }

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error(
          "[Upscale Submit Error]",
          submitResponse.status,
          errorText,
        );
        return NextResponse.json(
          {
            error: `Topaz upscale submission failed: ${submitResponse.statusText}`,
            detail: errorText,
          },
          { status: submitResponse.status },
        );
      }

      const submitPayload = (await submitResponse.json()) as {
        process_id?: string;
        eta?: number;
      };

      const processId = submitPayload.process_id;

      if (!processId) {
        return NextResponse.json(
          { error: "Topaz did not return a process ID" },
          { status: 502 },
        );
      }

      // ── Step 2: Poll for completion ────────────────────────────────────
      for (let attempt = 0; attempt < TOPAZ_MAX_POLLS; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, TOPAZ_POLL_INTERVAL_MS));

        const pollController = new AbortController();
        const pollTimeout = setTimeout(
          () => pollController.abort(),
          30_000,
        );

        let statusResponse: Response;
        try {
          statusResponse = await fetch(
            `https://api.topazlabs.com/image/v1/process/${processId}`,
            {
              headers: { "X-API-Key": apiKey },
              signal: pollController.signal,
            },
          );
        } finally {
          clearTimeout(pollTimeout);
        }

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error(
            "[Upscale Status Error]",
            statusResponse.status,
            errorText,
          );
          return NextResponse.json(
            {
              error: `Topaz status check failed: ${statusResponse.statusText}`,
              detail: errorText,
            },
            { status: statusResponse.status },
          );
        }

        const statusPayload = (await statusResponse.json()) as {
          status?: string;
        };
        const status = statusPayload.status;

        if (status === "succeeded") {
          // ── Step 3: Download the result image ──────────────────────────
          const resultController = new AbortController();
          const resultTimeout = setTimeout(
            () => resultController.abort(),
            60_000,
          );

          let resultResponse: Response;
          try {
            resultResponse = await fetch(
              `https://api.topazlabs.com/image/v1/process/${processId}/result`,
              {
                headers: { "X-API-Key": apiKey },
                signal: resultController.signal,
              },
            );
          } finally {
            clearTimeout(resultTimeout);
          }

          if (!resultResponse.ok) {
            const errorText = await resultResponse.text();
            console.error(
              "[Upscale Result Error]",
              resultResponse.status,
              errorText,
            );
            return NextResponse.json(
              {
                error: `Topaz result download failed: ${resultResponse.statusText}`,
                detail: errorText,
              },
              { status: resultResponse.status },
            );
          }

          const imageBuffer = await resultResponse.arrayBuffer();

          operationSucceeded = true;

          // Include remaining credits in a response header so the client can update UI
          let remaining = undefined;
          try {
            remaining = await getUserCredits(supabase, user.id);
          } catch (err) {
            // Ignore balance fetch errors
          }

          const headers: Record<string, string> = {
            "Content-Type": "image/png",
            "Content-Length": imageBuffer.byteLength.toString(),
          };

          if (typeof remaining === "number") {
            headers["X-Credits-Remaining"] = String(remaining);
          }

          return new NextResponse(imageBuffer, { headers });
        }

        if (status === "failed") {
          return NextResponse.json(
            { error: "Topaz upscale failed" },
            { status: 502 },
          );
        }

        // "pending" / "processing" / unknown → continue polling
      }

      return NextResponse.json(
        { error: "Topaz upscale timed out. Please try again." },
        { status: 504 },
      );
    } finally {
      if (!operationSucceeded) {
        try {
          await addUserCredits(supabase, user.id, UPSCALE_CREDIT_COST);
        } catch (refundErr) {
          console.error("[Upscale] Failed to refund credits:", refundErr);
        }
      }
    }

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Upscale Route Error]", message);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Topaz upscale request timed out. Please try again." },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: `Failed to upscale image: ${message}` },
      { status: 500 },
    );
  }
}