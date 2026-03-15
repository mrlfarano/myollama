import { NextRequest, NextResponse } from "next/server";
import { getConfig, setOllamaUrl } from "@/lib/config";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({ ollamaUrl: config.ollamaUrl });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  if (body.ollamaUrl) {
    await setOllamaUrl(body.ollamaUrl);
  }
  return NextResponse.json({ success: true });
}
