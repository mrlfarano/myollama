"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ModelDetails } from "@/components/model-details";
import type { OllamaModel } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ModelListItemProps {
  model: OllamaModel;
  onDeleted: () => void;
}

export function ModelListItem({ model, onDeleted }: ModelListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/ollama/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      toast.success(`Deleted ${model.name}`);
      onDeleted();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete model"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      {/* Header row */}
      <div className="flex items-center gap-3 p-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse details" : "Expand details"}
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{model.name}</h3>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(model.modified_at)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {model.details.family && (
                <Badge variant="secondary" className="text-xs">
                  {model.details.family}
                </Badge>
              )}
              {model.details.parameter_size && (
                <Badge variant="outline" className="text-xs">
                  {model.details.parameter_size}
                </Badge>
              )}
            </div>
          </div>

          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {formatBytes(model.size)}
          </span>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            aria-label={`Delete ${model.name}`}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t">
          <ModelDetails modelName={model.name} />
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Model"
        description={`Are you sure you want to delete "${model.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
