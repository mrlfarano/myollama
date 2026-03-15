// ===== Ollama API Types =====

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

export interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[] | null;
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface OllamaShowRequest {
  model: string;
}

export interface OllamaShowResponse {
  modelfile: string;
  parameters: string;
  template: string;
  system?: string;
  license?: string;
  details: OllamaModelDetails;
  model_info: Record<string, unknown>;
  modified_at: string;
}

export interface OllamaPullRequest {
  model: string;
  stream?: boolean;
}

export interface OllamaPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface OllamaDeleteRequest {
  model: string;
}

export interface OllamaCreateRequest {
  model: string;
  from: string;
  system?: string;
  parameters?: Record<string, number | string>;
}

export interface OllamaCreateProgress {
  status: string;
}

// ===== Catalog Types =====

export interface CatalogModel {
  name: string;
  description: string;
  categories: string[];
  tags: string[];
  default_tag: string;
  size_category: "small" | "medium" | "large";
  url: string;
}

export interface Catalog {
  models: CatalogModel[];
}

// ===== Config Types =====

export interface ModelfileDraft {
  name: string;
  from: string;
  system: string;
  parameters: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  version: number;
  ollamaUrl: string;
  modelfiles: ModelfileDraft[];
}

// ===== UI State Types =====

export type PullStatus = "idle" | "pulling" | "downloading" | "verifying" | "success" | "failed";

export interface PullState {
  model: string;
  status: PullStatus;
  total?: number;
  completed?: number;
  error?: string;
}

export type ConnectionStatus = "connected" | "disconnected" | "checking";

// ===== Filter Types =====

export type CategoryFilter = "all" | "chat" | "code" | "vision" | "embedding";
export type SizeFilter = "all" | "small" | "medium" | "large";
