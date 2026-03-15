import { NextResponse } from "next/server";
import { listModels } from "@/lib/ollama";

export async function GET() {
  try {
    const data = await listModels();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect to Ollama" },
      { status: 502 }
    );
  }
}
