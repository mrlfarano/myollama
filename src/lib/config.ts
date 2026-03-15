import { promises as fs } from "fs";
import path from "path";
import os from "os";
import type { AppConfig, ModelfileDraft } from "@/types";

const CONFIG_DIR = path.join(os.homedir(), ".myollama");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  ollamaUrl: "http://localhost:11434",
  modelfiles: [],
};

export async function getConfig(): Promise<AppConfig> {
  try {
    const data = await fs.readFile(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export async function getOllamaUrl(): Promise<string> {
  const config = await getConfig();
  return config.ollamaUrl;
}

export async function setOllamaUrl(url: string): Promise<void> {
  const config = await getConfig();
  config.ollamaUrl = url;
  await saveConfig(config);
}

export async function getModelfiles(): Promise<ModelfileDraft[]> {
  const config = await getConfig();
  return config.modelfiles;
}

export async function saveModelfile(draft: ModelfileDraft): Promise<void> {
  const config = await getConfig();
  const index = config.modelfiles.findIndex((m) => m.name === draft.name);
  if (index >= 0) {
    config.modelfiles[index] = draft;
  } else {
    config.modelfiles.push(draft);
  }
  await saveConfig(config);
}

export async function deleteModelfile(name: string): Promise<void> {
  const config = await getConfig();
  config.modelfiles = config.modelfiles.filter((m) => m.name !== name);
  await saveConfig(config);
}
