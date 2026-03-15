import { NextRequest, NextResponse } from "next/server";
import { getModelfiles, saveModelfile, deleteModelfile } from "@/lib/config";

export async function GET() {
  const modelfiles = await getModelfiles();
  return NextResponse.json({ modelfiles });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  await saveModelfile({
    ...body,
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  await deleteModelfile(body.name);
  return NextResponse.json({ success: true });
}
