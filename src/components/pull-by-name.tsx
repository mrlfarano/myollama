"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePull } from "@/contexts/pull-context";
import { useConnection } from "@/contexts/connection-context";

export function PullByName() {
  const [name, setName] = useState("");
  const { startPull } = usePull();
  const { status } = useConnection();
  const disabled = status !== "connected";

  const handlePull = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    startPull(trimmed);
    setName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePull();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2">
        <Input
          placeholder="Pull a model by name, e.g. llama3:8b"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          onClick={handlePull}
          disabled={disabled || !name.trim()}
        >
          Pull
        </Button>
      </div>
    </div>
  );
}
