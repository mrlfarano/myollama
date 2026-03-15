"use client";

import type { PullState } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) {
    return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  }
  return `${Math.round(bytes / 1_000_000)} MB`;
}

interface PullProgressProps {
  state: PullState;
  onRetry?: () => void;
}

export function PullProgress({ state, onRetry }: PullProgressProps) {
  if (state.status === "failed") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <span className="truncate">{state.error || "Download failed"}</span>
        {onRetry && (
          <Button variant="outline" size="xs" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <p className="text-sm text-green-500">Downloaded successfully</p>
    );
  }

  if (state.status === "verifying") {
    return (
      <p className="text-sm text-muted-foreground animate-pulse">
        Verifying...
      </p>
    );
  }

  if (state.status === "downloading" && state.total && state.completed !== undefined) {
    const pct = Math.round((state.completed / state.total) * 100);
    return (
      <div className="flex flex-col gap-1">
        <Progress value={pct} />
        <p className="text-xs text-muted-foreground">
          {formatBytes(state.completed)} / {formatBytes(state.total)} ({pct}%)
        </p>
      </div>
    );
  }

  // Default: pulling manifest
  return (
    <p className="text-sm text-muted-foreground animate-pulse">
      Pulling manifest...
    </p>
  );
}
