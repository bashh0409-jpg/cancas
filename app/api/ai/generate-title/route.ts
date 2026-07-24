import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const text = message.trim();

    // Extract first sentence (up to period, question mark, or exclamation)
    const sentenceMatch = text.match(/^[^.!?]*[.!?]/);
    let title = sentenceMatch ? sentenceMatch[0].replace(/[.!?]$/, "").trim() : text;

    // If first sentence is too long, take first few words instead
    if (title.length > 60) {
      title = text.split(/\s+/).slice(0, 5).join(" ");
    }

    // Truncate to 60 characters max
    title = title.substring(0, 60).trim();

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Title generation error:", error);
    return NextResponse.json({
      title: "",
      error: String(error),
    });
  }
}
