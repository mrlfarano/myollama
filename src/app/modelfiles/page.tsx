"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FileCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModelfileForm } from "@/components/modelfile-form";
import { ModelfilePreview } from "@/components/modelfile-preview";
import type { ModelfileDraft, OllamaModel, OllamaCreateRequest } from "@/types";

export default function ModelfilesPage() {
  const [drafts, setDrafts] = useState<ModelfileDraft[]>([]);
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<ModelfileDraft | null>(null);
  const [request, setRequest] = useState<OllamaCreateRequest>({ model: "", from: "" });

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/modelfiles");
      if (!res.ok) throw new Error("Failed to fetch drafts");
      const data = await res.json();
      setDrafts(data.modelfiles || []);
    } catch {
      // Silently fail — drafts are optional
    }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/ollama/tags");
      if (!res.ok) throw new Error("Failed to fetch models");
      const data = await res.json();
      setInstalledModels(data.models || []);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
    fetchModels();
  }, [fetchDrafts, fetchModels]);

  const handleDeleteDraft = async (name: string) => {
    try {
      const res = await fetch("/api/modelfiles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to delete draft");

      toast.success(`Deleted draft "${name}"`);
      if (selectedDraft?.name === name) {
        setSelectedDraft(null);
      }
      fetchDrafts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete draft");
    }
  };

  const handleRequestChange = useCallback((req: OllamaCreateRequest) => {
    setRequest(req);
  }, []);

  const handleSaved = useCallback(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  return (
    <div className="flex h-full -m-6">
      {/* Left sidebar — Draft list */}
      <div className="w-56 flex-shrink-0 border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h3 className="text-sm font-medium">Drafts</h3>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSelectedDraft(null)}
            aria-label="New draft"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {drafts.length === 0 ? (
            <div className="px-3 py-4">
              <p className="text-xs text-muted-foreground">
                No saved drafts. Create one using the form.
              </p>
            </div>
          ) : (
            <div className="py-1">
              {drafts.map((d) => (
                <div
                  key={d.name}
                  className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted/50 ${
                    selectedDraft?.name === d.name ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedDraft(d)}
                >
                  <FileCode className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{d.name}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDraft(d.name);
                    }}
                    aria-label={`Delete ${d.name}`}
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Center — Form */}
      <div className="flex-1 min-w-0">
        <ModelfileForm
          draft={selectedDraft}
          installedModels={installedModels}
          onRequestChange={handleRequestChange}
          onSaved={handleSaved}
        />
      </div>

      {/* Right — Preview */}
      <div className="w-96 flex-shrink-0 border-l border-border">
        <ModelfilePreview request={request} />
      </div>
    </div>
  );
}
