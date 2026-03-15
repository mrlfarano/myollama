import { NextRequest } from "next/server";
import { pullModel } from "@/lib/ollama";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await pullModel(body);

    if (!response.body) {
      return new Response("No response body from Ollama", { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Pull failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
