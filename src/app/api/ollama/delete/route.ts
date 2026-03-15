import { NextRequest, NextResponse } from "next/server";
import { deleteModel } from "@/lib/ollama";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    await deleteModel(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 502 }
    );
  }
}
