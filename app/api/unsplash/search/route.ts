import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("per_page") ?? "20", 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 },
      );
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      return NextResponse.json(
        { error: "Unsplash API key not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `Unsplash API error: ${response.status}`, detail: errorText },
        { status: response.status },
      );
    }

    const data = (await response.json()) as {
      results: Array<{
        id: string;
        urls: {
          raw: string;
          full: string;
          regular: string;
          small: string;
          thumb: string;
        };
        alt_description: string | null;
        description: string | null;
        user: {
          name: string;
          links: { html: string };
        };
        links: { download: string; html: string };
        width: number;
        height: number;
      }>;
      total: number;
      total_pages: number;
    };

    // Track download on Unsplash (required by API guidelines)
    for (const result of data.results) {
      if (result.links.download) {
        fetch(result.links.download, {
          headers: { Authorization: `Client-ID ${accessKey}` },
        }).catch(() => {
          // Best-effort tracking
        });
      }
    }

    return NextResponse.json({
      results: data.results.map((r) => ({
        id: r.id,
        urls: r.urls,
        alt: r.alt_description ?? r.description ?? "Unsplash image",
        photographer: r.user.name,
        photographerUrl: r.user.links.html,
        unsplashUrl: r.links.html,
        width: r.width,
        height: r.height,
      })),
      total: data.total,
      totalPages: data.total_pages,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search Unsplash";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}