"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModelListItem } from "@/components/model-list-item";
import { useConnection } from "@/contexts/connection-context";
import type { OllamaModel } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function ModelsPage() {
  const { status } = useConnection();
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/ollama/tags");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setModels(data.models || []);
    } catch {
      setError(true);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const totalSize = models.reduce((sum, m) => sum + m.size, 0);

  // Error / disconnected state
  if (!loading && (error || status === "disconnected")) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-semibold">Installed Models</h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <p className="text-sm">Cannot connect to Ollama.</p>
          <Link
            href="/settings"
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Check Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Installed Models</h2>
          {!loading && models.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {models.length} model{models.length !== 1 ? "s" : ""} &middot;{" "}
              {formatBytes(totalSize)}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchModels}
          disabled={loading}
          aria-label="Refresh model list"
        >
          <RefreshCw
            className={`size-4 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && models.length === 0 && !error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Package className="size-12 stroke-1" />
          <p className="text-sm">No models installed yet.</p>
          <Link
            href="/"
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Browse the Library
          </Link>
        </div>
      )}

      {/* Model list */}
      {!loading && models.length > 0 && (
        <div className="flex-1 space-y-2 overflow-auto">
          {models.map((model) => (
            <ModelListItem
              key={model.digest}
              model={model}
              onDeleted={fetchModels}
            />
          ))}
        </div>
      )}
    </div>
  );
}
