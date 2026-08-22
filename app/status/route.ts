import { NextResponse } from "next/server";

export function GET() {
  const statusPageUrl = process.env.NEXT_PUBLIC_STATUS_PAGE_URL;

  if (!statusPageUrl) {
    return new NextResponse("Status page is not configured.", { status: 503 });
  }

  return NextResponse.redirect(statusPageUrl);
}