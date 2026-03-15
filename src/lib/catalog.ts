import catalogData from "../../data/catalog.json";
import type { Catalog, CatalogModel, CategoryFilter, SizeFilter } from "@/types";

const catalog: Catalog = catalogData as Catalog;

export function searchCatalog(
  query: string,
  category: CategoryFilter = "all",
  size: SizeFilter = "all"
): CatalogModel[] {
  let results = catalog.models;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.categories.some((c) => c.toLowerCase().includes(q))
    );
  }

  if (category !== "all") {
    results = results.filter((m) => m.categories.includes(category));
  }

  if (size !== "all") {
    results = results.filter((m) => m.size_category === size);
  }

  return results;
}

export function getAllModels(): CatalogModel[] {
  return catalog.models;
}
