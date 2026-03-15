import { NextRequest, NextResponse } from "next/server";
import { showModel } from "@/lib/ollama";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await showModel(body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get model details" },
      { status: 502 }
    );
  }
}
