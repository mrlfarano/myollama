import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the config module before importing ollama
vi.mock("@/lib/config", () => ({
  getOllamaUrl: vi.fn().mockResolvedValue("http://localhost:11434"),
}));

import {
  listModels,
  showModel,
  deleteModel,
  checkConnection,
} from "@/lib/ollama";
import { getOllamaUrl } from "@/lib/config";

describe("ollama", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Re-establish the mock after restoreAllMocks
    vi.mocked(getOllamaUrl).mockResolvedValue("http://localhost:11434");
  });

  describe("listModels", () => {
    it("calls correct URL and returns parsed response", async () => {
      const mockResponse = {
        models: [
          {
            name: "llama3:8b",
            model: "llama3:8b",
            modified_at: "2025-01-01T00:00:00Z",
            size: 4_000_000_000,
            digest: "abc123",
            details: {
              parent_model: "",
              format: "gguf",
              family: "llama",
              families: ["llama"],
              parameter_size: "8B",
              quantization_level: "Q4_K_M",
            },
          },
        ],
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      );

      const result = await listModels();
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:11434/api/tags",
        undefined
      );
    });

    it("throws on non-OK response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        })
      );

      await expect(listModels()).rejects.toThrow("Ollama error: 500");
    });
  });

  describe("showModel", () => {
    it("sends correct POST body", async () => {
      const mockResponse = {
        modelfile: "FROM llama3",
        parameters: "",
        template: "",
        details: {
          parent_model: "",
          format: "gguf",
          family: "llama",
          families: ["llama"],
          parameter_size: "8B",
          quantization_level: "Q4_K_M",
        },
        model_info: {},
        modified_at: "2025-01-01T00:00:00Z",
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      );

      await showModel({ model: "llama3:8b" });

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:11434/api/show",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "llama3:8b" }),
        })
      );
    });
  });

  describe("deleteModel", () => {
    it("sends correct DELETE request", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
        })
      );

      await deleteModel({ model: "llama3:8b" });

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:11434/api/delete",
        expect.objectContaining({
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "llama3:8b" }),
        })
      );
    });
  });

  describe("checkConnection", () => {
    it("returns true when server responds", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
        })
      );

      const result = await checkConnection();
      expect(result).toBe(true);
    });

    it("returns false when server is down", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
      );

      const result = await checkConnection();
      expect(result).toBe(false);
    });
  });
});
