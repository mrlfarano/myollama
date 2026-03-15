"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ModelCard } from "@/components/model-card";
import { PullByName } from "@/components/pull-by-name";
import type { CatalogModel, CategoryFilter, SizeFilter } from "@/types";

const categories: { label: string; value: CategoryFilter }[] = [
  { label: "All", value: "all" },
  { label: "Chat", value: "chat" },
  { label: "Code", value: "code" },
  { label: "Vision", value: "vision" },
  { label: "Embedding", value: "embedding" },
];

const sizes: { label: string; value: SizeFilter }[] = [
  { label: "All Sizes", value: "all" },
  { label: "Small <4B", value: "small" },
  { label: "Medium 4-13B", value: "medium" },
  { label: "Large 13B+", value: "large" },
];

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [size, setSize] = useState<SizeFilter>("all");
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [installedNames, setInstalledNames] = useState<Set<string>>(new Set());

  // Fetch catalog when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (size !== "all") params.set("size", size);

    fetch(`/api/catalog?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setModels(data.models || []))
      .catch(() => setModels([]));
  }, [query, category, size]);

  // Fetch installed models on mount
  useEffect(() => {
    fetch("/api/ollama/tags")
      .then((res) => res.json())
      .then((data) => {
        const names = new Set<string>();
        for (const m of data.models || []) {
          // Extract base name from "model:tag"
          const baseName = (m.name as string).split(":")[0];
          names.add(baseName);
        }
        setInstalledNames(names);
      })
      .catch(() => setInstalledNames(new Set()));
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Search + Filters */}
      <div className="space-y-4 pb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.value}
              variant={category === cat.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}

          <div className="mx-1 h-4 w-px bg-border" />

          {sizes.map((s) => (
            <Badge
              key={s.value}
              variant={size === s.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSize(s.value)}
            >
              {s.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Model Grid */}
      <div className="flex-1 overflow-auto">
        {models.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            No models found
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {models.map((model) => (
              <ModelCard
                key={model.name}
                model={model}
                installed={installedNames.has(model.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pull by Name bar */}
      <PullByName />
    </div>
  );
}
