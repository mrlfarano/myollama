"use client";

import { useState, useEffect } from "react";
import { Save, PlugZap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useConnection } from "@/contexts/connection-context";

export default function SettingsPage() {
  const { ollamaUrl, refresh } = useConnection();
  const [url, setUrl] = useState("");
  const [testResult, setTestResult] = useState<"connected" | "failed" | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ollamaUrl) {
      setUrl(ollamaUrl);
    }
  }, [ollamaUrl]);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setTestResult(data.connected ? "connected" : "failed");
    } catch {
      setTestResult("failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ollamaUrl: url }),
      });
      if (res.ok) {
        toast.success("Settings saved");
        refresh();
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h2 className="text-lg font-semibold">Settings</h2>

      <div className="space-y-3">
        <label htmlFor="ollama-url" className="text-sm font-medium">
          Ollama Server URL
        </label>
        <Input
          id="ollama-url"
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setTestResult(null);
          }}
          placeholder="http://127.0.0.1:11434"
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !url}
          >
            <PlugZap className="size-4" />
            {testing ? "Testing..." : "Test"}
          </Button>

          {testResult === "connected" && (
            <Badge variant="default">Connected</Badge>
          )}
          {testResult === "failed" && (
            <Badge variant="destructive">Connection failed</Badge>
          )}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || !url}>
        <Save className="size-4" />
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
