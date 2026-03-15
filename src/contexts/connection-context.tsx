"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { ConnectionStatus } from "@/types";

interface ConnectionContextValue {
  status: ConnectionStatus;
  ollamaUrl: string;
  refresh: () => void;
}

const ConnectionContext = createContext<ConnectionContextValue>({
  status: "checking",
  ollamaUrl: "",
  refresh: () => {},
});

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [ollamaUrl, setOllamaUrl] = useState("");

  const refresh = useCallback(async () => {
    setStatus("checking");
    try {
      const settingsRes = await fetch("/api/settings");
      const settings = await settingsRes.json();
      setOllamaUrl(settings.ollamaUrl);

      const tagsRes = await fetch("/api/ollama/tags");
      setStatus(tagsRes.ok ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    // Use a local async wrapper to avoid calling setState synchronously
    // in the effect body (the initial state of "checking" covers the first render).
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await refresh();
    };
    run();
    const interval = setInterval(refresh, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refresh]);

  return (
    <ConnectionContext.Provider value={{ status, ollamaUrl, refresh }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}
