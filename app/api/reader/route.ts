import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();

    const dom = new JSDOM(html, {
      url,
    });

    const article = new Readability(dom.window.document).parse();

    if (!article) {
      return NextResponse.json(
        { error: "Could not extract article" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      title: article.title,
      excerpt: article.excerpt,
      byline: article.byline,
      content: article.content,
      textContent: article.textContent,
      length: article.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 },
    );
  }
}
