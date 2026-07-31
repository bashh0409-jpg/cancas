import { NextRequest, NextResponse } from "next/server";

const REMOVE_BG_TIMEOUT_MS = 30_000;

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

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.byteLength.toString(),
      },
    });
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

    return NextResponse.json(
      { error: `Failed to remove background: ${message}` },
      { status: 500 },
    );
  }
}