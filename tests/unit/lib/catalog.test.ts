import { describe, it, expect } from "vitest";
import { searchCatalog, getAllModels } from "@/lib/catalog";

describe("catalog", () => {
  describe("getAllModels", () => {
    it("returns all catalog models", () => {
      const models = getAllModels();
      expect(models.length).toBeGreaterThan(0);
      // Every model should have the required fields
      for (const m of models) {
        expect(m.name).toBeDefined();
        expect(m.description).toBeDefined();
        expect(m.categories).toBeInstanceOf(Array);
        expect(m.tags).toBeInstanceOf(Array);
        expect(m.default_tag).toBeDefined();
        expect(["small", "medium", "large"]).toContain(m.size_category);
      }
    });
  });

  describe("searchCatalog", () => {
    it("returns all models when query is empty", () => {
      const results = searchCatalog("");
      const all = getAllModels();
      expect(results).toHaveLength(all.length);
    });

    it("filters by name when query is provided", () => {
      const results = searchCatalog("llama");
      expect(results.length).toBeGreaterThan(0);
      for (const m of results) {
        const matchesName = m.name.toLowerCase().includes("llama");
        const matchesDescription = m.description.toLowerCase().includes("llama");
        const matchesCategory = m.categories.some((c) =>
          c.toLowerCase().includes("llama")
        );
        expect(matchesName || matchesDescription || matchesCategory).toBe(true);
      }
    });

    it("filters by category", () => {
      const results = searchCatalog("", "code");
      expect(results.length).toBeGreaterThan(0);
      for (const m of results) {
        expect(m.categories).toContain("code");
      }
    });

    it("filters by size", () => {
      const results = searchCatalog("", "all", "small");
      expect(results.length).toBeGreaterThan(0);
      for (const m of results) {
        expect(m.size_category).toBe("small");
      }
    });

    it("returns empty array for nonexistent query", () => {
      const results = searchCatalog("zzz_nonexistent_model_xyz");
      expect(results).toHaveLength(0);
    });

    it("combines query and category filters", () => {
      // Search for something in code category
      const results = searchCatalog("coder", "code");
      expect(results.length).toBeGreaterThan(0);
      for (const m of results) {
        expect(m.categories).toContain("code");
        const matchesName = m.name.toLowerCase().includes("coder");
        const matchesDescription = m.description
          .toLowerCase()
          .includes("coder");
        expect(matchesName || matchesDescription).toBe(true);
      }
    });

    it("combines query, category, and size filters", () => {
      // Get all small code models, check if any match
      const codeSmall = searchCatalog("", "code", "small");
      if (codeSmall.length > 0) {
        for (const m of codeSmall) {
          expect(m.categories).toContain("code");
          expect(m.size_category).toBe("small");
        }
      }
      // Even if empty, no error should occur
      expect(Array.isArray(codeSmall)).toBe(true);
    });
  });
});
