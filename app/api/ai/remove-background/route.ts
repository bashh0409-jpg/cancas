import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json(
        { error: "Remove background API key is not configured" },
        { status: 500 },
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

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: removeBgFormData,
    });

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
    console.error(
      "[Remove Background Route Error]",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "Failed to remove background" },
      { status: 500 },
    );
  }
}