import { NextRequest, NextResponse } from "next/server";
import { searchCatalog, getAllModels } from "@/lib/catalog";
import type { CategoryFilter, SizeFilter } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = (searchParams.get("category") || "all") as CategoryFilter;
  const size = (searchParams.get("size") || "all") as SizeFilter;

  const models = query || category !== "all" || size !== "all"
    ? searchCatalog(query, category, size)
    : getAllModels();

  return NextResponse.json({ models });
}
