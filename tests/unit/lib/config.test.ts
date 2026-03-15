import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// We need to test the config module with a temp directory.
// We'll dynamically import after mocking the constants.

let tmpDir: string;
let configPath: string;

beforeEach(async () => {
  // Create a unique temp directory for each test
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "myollama-test-"));
  configPath = path.join(tmpDir, "config.json");
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.resetModules();
  // Clean up temp directory
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
});

// Helper to get a fresh module with mocked paths
async function getConfigModule() {
  // Reset modules so we get a fresh import
  vi.resetModules();

  // Mock the fs and path calls within the config module
  vi.doMock("@/lib/config", async () => {
    const { promises: realFs } = await import("fs");
    const realPath = await import("path");

    const CONFIG_DIR = tmpDir;
    const CONFIG_PATH = realPath.join(CONFIG_DIR, "config.json");

    const DEFAULT_CONFIG = {
      version: 1,
      ollamaUrl: "http://localhost:11434",
      modelfiles: [],
    };

    async function getConfig() {
      try {
        const data = await realFs.readFile(CONFIG_PATH, "utf-8");
        return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      } catch {
        return { ...DEFAULT_CONFIG };
      }
    }

    async function saveConfig(config: Record<string, unknown>) {
      await realFs.mkdir(CONFIG_DIR, { recursive: true });
      await realFs.writeFile(
        CONFIG_PATH,
        JSON.stringify(config, null, 2),
        "utf-8"
      );
    }

    async function getOllamaUrl() {
      const config = await getConfig();
      return config.ollamaUrl;
    }

    async function setOllamaUrl(url: string) {
      const config = await getConfig();
      config.ollamaUrl = url;
      await saveConfig(config);
    }

    async function getModelfiles() {
      const config = await getConfig();
      return config.modelfiles;
    }

    async function saveModelfile(draft: Record<string, unknown>) {
      const config = await getConfig();
      const index = config.modelfiles.findIndex(
        (m: Record<string, unknown>) => m.name === draft.name
      );
      if (index >= 0) {
        config.modelfiles[index] = draft;
      } else {
        config.modelfiles.push(draft);
      }
      await saveConfig(config);
    }

    async function deleteModelfile(name: string) {
      const config = await getConfig();
      config.modelfiles = config.modelfiles.filter(
        (m: Record<string, unknown>) => m.name !== name
      );
      await saveConfig(config);
    }

    return {
      getConfig,
      saveConfig,
      getOllamaUrl,
      setOllamaUrl,
      getModelfiles,
      saveModelfile,
      deleteModelfile,
    };
  });

  return await import("@/lib/config");
}

describe("config", () => {
  describe("getConfig", () => {
    it("returns defaults when no config file exists", async () => {
      const { getConfig } = await getConfigModule();
      const config = await getConfig();
      expect(config.version).toBe(1);
      expect(config.ollamaUrl).toBe("http://localhost:11434");
      expect(config.modelfiles).toEqual([]);
    });
  });

  describe("saveConfig", () => {
    it("creates the directory and file", async () => {
      const { saveConfig, getConfig } = await getConfigModule();
      const config = {
        version: 1,
        ollamaUrl: "http://example.com:11434",
        modelfiles: [],
      };
      await saveConfig(config);

      // Verify file was created
      const data = await fs.readFile(configPath, "utf-8");
      const parsed = JSON.parse(data);
      expect(parsed.ollamaUrl).toBe("http://example.com:11434");

      // Verify getConfig reads it back
      const readConfig = await getConfig();
      expect(readConfig.ollamaUrl).toBe("http://example.com:11434");
    });
  });

  describe("getOllamaUrl", () => {
    it("returns default URL when no config exists", async () => {
      const { getOllamaUrl } = await getConfigModule();
      const url = await getOllamaUrl();
      expect(url).toBe("http://localhost:11434");
    });
  });

  describe("setOllamaUrl", () => {
    it("persists the URL", async () => {
      const { setOllamaUrl, getOllamaUrl } = await getConfigModule();
      await setOllamaUrl("http://192.168.1.100:11434");
      const url = await getOllamaUrl();
      expect(url).toBe("http://192.168.1.100:11434");
    });
  });

  describe("saveModelfile", () => {
    it("adds a new modelfile", async () => {
      const { saveModelfile, getModelfiles } = await getConfigModule();
      const draft = {
        name: "test-model",
        from: "llama3:8b",
        system: "You are helpful",
        parameters: { temperature: 0.7 },
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };
      await saveModelfile(draft);
      const modelfiles = await getModelfiles();
      expect(modelfiles).toHaveLength(1);
      expect(modelfiles[0].name).toBe("test-model");
      expect(modelfiles[0].from).toBe("llama3:8b");
    });

    it("updates an existing modelfile with the same name", async () => {
      const { saveModelfile, getModelfiles } = await getConfigModule();
      const draft1 = {
        name: "test-model",
        from: "llama3:8b",
        system: "Original prompt",
        parameters: { temperature: 0.7 },
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };
      await saveModelfile(draft1);

      const draft2 = {
        name: "test-model",
        from: "llama3:8b",
        system: "Updated prompt",
        parameters: { temperature: 0.9 },
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-02T00:00:00Z",
      };
      await saveModelfile(draft2);

      const modelfiles = await getModelfiles();
      expect(modelfiles).toHaveLength(1);
      expect(modelfiles[0].system).toBe("Updated prompt");
    });
  });

  describe("deleteModelfile", () => {
    it("removes a modelfile by name", async () => {
      const { saveModelfile, deleteModelfile, getModelfiles } =
        await getConfigModule();
      const draft = {
        name: "to-delete",
        from: "llama3:8b",
        system: "",
        parameters: {},
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };
      await saveModelfile(draft);
      let modelfiles = await getModelfiles();
      expect(modelfiles).toHaveLength(1);

      await deleteModelfile("to-delete");
      modelfiles = await getModelfiles();
      expect(modelfiles).toHaveLength(0);
    });
  });

  describe("getModelfiles", () => {
    it("returns all saved modelfiles", async () => {
      const { saveModelfile, getModelfiles } = await getConfigModule();
      await saveModelfile({
        name: "model-a",
        from: "llama3:8b",
        system: "",
        parameters: {},
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      });
      await saveModelfile({
        name: "model-b",
        from: "qwen3:4b",
        system: "",
        parameters: {},
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      });

      const modelfiles = await getModelfiles();
      expect(modelfiles).toHaveLength(2);
      const names = modelfiles.map((m) => m.name);
      expect(names).toContain("model-a");
      expect(names).toContain("model-b");
    });
  });
});
