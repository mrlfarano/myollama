"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { OllamaCreateRequest } from "@/types";

export function ModelfilePreview({ request }: { request: OllamaCreateRequest }) {
  const json = JSON.stringify(request, null, 2);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground">API Request Preview</h3>
      </div>
      <ScrollArea className="flex-1">
        <pre className="p-4 text-sm font-mono text-muted-foreground leading-relaxed">
          {json}
        </pre>
      </ScrollArea>
    </div>
  );
}
