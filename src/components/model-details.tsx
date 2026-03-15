"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OllamaShowResponse } from "@/types";

interface ModelDetailsProps {
  modelName: string;
}

export function ModelDetails({ modelName }: ModelDetailsProps) {
  const [data, setData] = useState<OllamaShowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ollama/show", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelName }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch model details");
        return res.json();
      })
      .then((json: OllamaShowResponse) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      setData(null);
      setLoading(true);
      setError(null);
    };
  }, [modelName]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load details: {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 p-4">
      {/* Basic info grid */}
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <span className="text-muted-foreground">Family</span>
          <p className="font-medium">{data.details.family || "Unknown"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Parameter Size</span>
          <p className="font-medium">
            {data.details.parameter_size || "Unknown"}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Quantization</span>
          <p className="font-medium">
            {data.details.quantization_level || "Unknown"}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Format</span>
          <p className="font-medium">{data.details.format || "Unknown"}</p>
        </div>
      </div>

      {/* System prompt */}
      {data.system && (
        <>
          <Separator />
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              System Prompt
            </h4>
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
              {data.system}
            </pre>
          </div>
        </>
      )}

      {/* Parameters */}
      {data.parameters && (
        <>
          <Separator />
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Parameters
            </h4>
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
              {data.parameters}
            </pre>
          </div>
        </>
      )}

      {/* Template */}
      {data.template && (
        <>
          <Separator />
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Template
            </h4>
            <ScrollArea className="max-h-48">
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                {data.template}
              </pre>
            </ScrollArea>
          </div>
        </>
      )}

      {/* License */}
      {data.license && (
        <>
          <Separator />
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              License
            </h4>
            <ScrollArea className="max-h-48">
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                {data.license}
              </pre>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
