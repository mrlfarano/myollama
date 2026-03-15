"use client";

import { useConnection } from "@/contexts/connection-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const { status, ollamaUrl } = useConnection();

  const color = status === "connected"
    ? "bg-green-500"
    : status === "disconnected"
    ? "bg-red-500"
    : "bg-yellow-500 animate-pulse";

  const label = status === "connected"
    ? `Connected to ${ollamaUrl}`
    : status === "disconnected"
    ? `Cannot connect to ${ollamaUrl}`
    : "Checking connection...";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${color}`} />
          <span className="hidden sm:inline truncate max-w-[200px]">{ollamaUrl}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
