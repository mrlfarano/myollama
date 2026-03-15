import type {
  OllamaTagsResponse,
  OllamaShowRequest,
  OllamaShowResponse,
  OllamaPullRequest,
  OllamaDeleteRequest,
  OllamaCreateRequest,
} from "@/types";
import { getOllamaUrl } from "./config";

async function ollamaFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const baseUrl = await getOllamaUrl();
  const url = `${baseUrl}${path}`;
  return fetch(url, options);
}

export async function listModels(): Promise<OllamaTagsResponse> {
  const res = await ollamaFetch("/api/tags");
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function showModel(
  request: OllamaShowRequest
): Promise<OllamaShowResponse> {
  const res = await ollamaFetch("/api/show", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function pullModel(
  request: OllamaPullRequest
): Promise<Response> {
  const res = await ollamaFetch("/api/pull", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: true }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  return res;
}

export async function deleteModel(
  request: OllamaDeleteRequest
): Promise<void> {
  const res = await ollamaFetch("/api/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
}

export async function createModel(
  request: OllamaCreateRequest
): Promise<Response> {
  const res = await ollamaFetch("/api/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: true }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  return res;
}

export async function checkConnection(): Promise<boolean> {
  try {
    const baseUrl = await getOllamaUrl();
    const res = await fetch(baseUrl, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
