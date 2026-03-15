import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body.url?.replace(/\/$/, "");
    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return NextResponse.json({ connected: false, error: "Invalid URL" }, { status: 400 });
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return NextResponse.json({ connected: res.ok });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
