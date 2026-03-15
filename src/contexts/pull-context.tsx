"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { PullState } from "@/types";

interface PullContextValue {
  pulls: Map<string, PullState>;
  startPull: (model: string) => Promise<void>;
}

const PullContext = createContext<PullContextValue>({
  pulls: new Map(),
  startPull: async () => {},
});

export function PullProvider({ children }: { children: ReactNode }) {
  const [pulls, setPulls] = useState<Map<string, PullState>>(new Map());

  const startPull = useCallback(async (model: string) => {
    setPulls((prev) => {
      const next = new Map(prev);
      next.set(model, { model, status: "pulling" });
      return next;
    });

    try {
      const res = await fetch("/api/ollama/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Pull request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            setPulls((prev) => {
              const next = new Map(prev);
              if (data.status === "success") {
                next.set(model, { model, status: "success" });
              } else if (data.total && data.completed !== undefined) {
                next.set(model, {
                  model,
                  status: "downloading",
                  total: data.total,
                  completed: data.completed,
                });
              } else if (data.status?.includes("verifying")) {
                next.set(model, { model, status: "verifying" });
              } else {
                next.set(model, { model, status: "pulling" });
              }
              return next;
            });
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    } catch (error) {
      setPulls((prev) => {
        const next = new Map(prev);
        next.set(model, {
          model,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return next;
      });
    }
  }, []);

  return (
    <PullContext.Provider value={{ pulls, startPull }}>
      {children}
    </PullContext.Provider>
  );
}

export function usePull() {
  return useContext(PullContext);
}
