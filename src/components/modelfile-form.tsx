"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ModelfileDraft, OllamaModel, OllamaCreateRequest } from "@/types";

interface ModelfileFormProps {
  draft: ModelfileDraft | null;
  installedModels: OllamaModel[];
  onRequestChange: (request: OllamaCreateRequest) => void;
  onSaved: () => void;
}

const DEFAULTS = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  contextLength: 4096,
  repeatPenalty: 1.1,
};

export function ModelfileForm({
  draft,
  installedModels,
  onRequestChange,
  onSaved,
}: ModelfileFormProps) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [system, setSystem] = useState("");
  const [temperature, setTemperature] = useState(DEFAULTS.temperature);
  const [topP, setTopP] = useState(DEFAULTS.topP);
  const [topK, setTopK] = useState(DEFAULTS.topK);
  const [contextLength, setContextLength] = useState(DEFAULTS.contextLength);
  const [repeatPenalty, setRepeatPenalty] = useState(DEFAULTS.repeatPenalty);
  const [building, setBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState<string | null>(null);

  // Populate fields from draft
  useEffect(() => {
    if (draft) {
      setName(draft.name);
      setFrom(draft.from);
      setSystem(draft.system);
      setTemperature(draft.parameters.temperature ?? DEFAULTS.temperature);
      setTopP(draft.parameters.top_p ?? DEFAULTS.topP);
      setTopK(draft.parameters.top_k ?? DEFAULTS.topK);
      setContextLength(draft.parameters.num_ctx ?? DEFAULTS.contextLength);
      setRepeatPenalty(draft.parameters.repeat_penalty ?? DEFAULTS.repeatPenalty);
    } else {
      setName("");
      setFrom("");
      setSystem("");
      setTemperature(DEFAULTS.temperature);
      setTopP(DEFAULTS.topP);
      setTopK(DEFAULTS.topK);
      setContextLength(DEFAULTS.contextLength);
      setRepeatPenalty(DEFAULTS.repeatPenalty);
    }
  }, [draft]);

  // Build request object and notify parent
  const buildRequest = useCallback((): OllamaCreateRequest => {
    const parameters: Record<string, number> = {};
    if (temperature !== DEFAULTS.temperature) parameters.temperature = temperature;
    if (topP !== DEFAULTS.topP) parameters.top_p = topP;
    if (topK !== DEFAULTS.topK) parameters.top_k = topK;
    if (contextLength !== DEFAULTS.contextLength) parameters.num_ctx = contextLength;
    if (repeatPenalty !== DEFAULTS.repeatPenalty) parameters.repeat_penalty = repeatPenalty;

    const request: OllamaCreateRequest = {
      model: name,
      from,
    };

    if (system.trim()) {
      request.system = system;
    }
    if (Object.keys(parameters).length > 0) {
      request.parameters = parameters;
    }

    return request;
  }, [name, from, system, temperature, topP, topK, contextLength, repeatPenalty]);

  useEffect(() => {
    onRequestChange(buildRequest());
  }, [buildRequest, onRequestChange]);

  const handleSaveDraft = async () => {
    if (!name.trim()) {
      toast.error("Model name is required");
      return;
    }
    if (!from.trim()) {
      toast.error("Base model is required");
      return;
    }

    try {
      const draftData: ModelfileDraft = {
        name,
        from,
        system,
        parameters: {
          temperature,
          top_p: topP,
          top_k: topK,
          num_ctx: contextLength,
          repeat_penalty: repeatPenalty,
        },
        createdAt: draft?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch("/api/modelfiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftData),
      });

      if (!res.ok) throw new Error("Failed to save draft");

      toast.success("Draft saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    }
  };

  const handleBuild = async () => {
    if (!name.trim()) {
      toast.error("Model name is required");
      return;
    }
    if (!from.trim()) {
      toast.error("Base model is required");
      return;
    }

    setBuilding(true);
    setBuildStatus("Starting build...");

    try {
      const request = buildRequest();
      const res = await fetch("/api/ollama/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Build failed");
      }

      if (!res.body) {
        throw new Error("No response body");
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
            const progress = JSON.parse(line);
            setBuildStatus(progress.status || "Building...");
          } catch {
            // Ignore malformed lines
          }
        }
      }

      toast.success(`Model "${name}" created successfully`);
      setBuildStatus(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Build failed");
      setBuildStatus(null);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground">Model Configuration</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Model Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Model Name</label>
            <Input
              placeholder="my-custom-model"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Base Model */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Base Model</label>
            <select
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              <option value="">Select a base model...</option>
              {installedModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            {installedModels.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No models installed. Install a model first from the Library.
              </p>
            )}
          </div>

          {/* System Prompt */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">System Prompt</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 resize-y"
              placeholder="You are a helpful assistant..."
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              rows={3}
            />
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Parameters</h4>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">Temperature</label>
                <span className="text-sm tabular-nums text-muted-foreground">{temperature.toFixed(2)}</span>
              </div>
              <Slider
                min={0}
                max={2}
                step={0.05}
                value={[temperature]}
                onValueChange={(val) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  setTemperature(Math.round(v * 100) / 100);
                }}
              />
            </div>

            {/* Top P */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">Top P</label>
                <span className="text-sm tabular-nums text-muted-foreground">{topP.toFixed(2)}</span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[topP]}
                onValueChange={(val) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  setTopP(Math.round(v * 100) / 100);
                }}
              />
            </div>

            {/* Top K */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">Top K</label>
                <span className="text-sm tabular-nums text-muted-foreground">{topK}</span>
              </div>
              <Input
                type="number"
                min={1}
                max={100}
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Context Length */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">Context Length</label>
                <span className="text-sm tabular-nums text-muted-foreground">{contextLength.toLocaleString()}</span>
              </div>
              <Input
                type="number"
                min={512}
                max={131072}
                step={512}
                value={contextLength}
                onChange={(e) => setContextLength(parseInt(e.target.value) || 512)}
              />
            </div>

            {/* Repeat Penalty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">Repeat Penalty</label>
                <span className="text-sm tabular-nums text-muted-foreground">{repeatPenalty.toFixed(2)}</span>
              </div>
              <Slider
                min={0.5}
                max={2}
                step={0.05}
                value={[repeatPenalty]}
                onValueChange={(val) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  setRepeatPenalty(Math.round(v * 100) / 100);
                }}
              />
            </div>
          </div>

          {/* Build Status */}
          {buildStatus && (
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
              <p className="text-sm text-muted-foreground">{buildStatus}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="size-4" data-icon="inline-start" />
              Save Draft
            </Button>
            <Button onClick={handleBuild} disabled={building}>
              <Play className="size-4" data-icon="inline-start" />
              {building ? "Building..." : "Build"}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
