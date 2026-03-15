"use client";

import type { CatalogModel } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagSelector } from "@/components/tag-selector";
import { PullProgress } from "@/components/pull-progress";
import { usePull } from "@/contexts/pull-context";
import { useConnection } from "@/contexts/connection-context";

interface ModelCardProps {
  model: CatalogModel;
  installed?: boolean;
}

export function ModelCard({ model, installed }: ModelCardProps) {
  const { pulls, startPull } = usePull();
  const { status: connStatus } = useConnection();

  const pullState = Array.from(pulls.values()).find(
    (p) => p.model === model.name || p.model.startsWith(`${model.name}:`)
  );

  const handleSelect = (fullName: string) => {
    startPull(fullName);
  };

  const handleRetry = () => {
    if (pullState) {
      startPull(pullState.model);
    }
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">
            {model.name}
          </h3>
          {installed && (
            <Badge variant="secondary" className="shrink-0">
              Installed
            </Badge>
          )}
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {model.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {model.categories.map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs capitalize">
              {cat}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs capitalize">
            {model.size_category}
          </Badge>
        </div>

        <div className="mt-auto pt-2">
          {pullState ? (
            <PullProgress state={pullState} onRetry={handleRetry} />
          ) : (
            <TagSelector
              model={model}
              onSelect={handleSelect}
              disabled={connStatus !== "connected"}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
