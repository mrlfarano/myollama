# MyOllama Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based Ollama model management tool distributed via `npx myollama` with three features: Model Library Browser, Installed Models Dashboard, and Modelfile Editor.

**Architecture:** Monolithic Next.js 15 app with App Router. API routes proxy all Ollama requests (browser never talks to Ollama directly). JSON config file at `~/.myollama/config.json` for persistence. Dark theme with shadcn/ui.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Radix UI primitives, Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-14-myollama-design.md`

---

## File Map

### Core Infrastructure
| File | Responsibility |
|------|---------------|
| `package.json` | Package config, bin entry, scripts, engines |
| `next.config.ts` | Next.js config with standalone output |
| `tailwind.config.ts` | Tailwind config with shadcn/ui theme |
| `tsconfig.json` | TypeScript config |
| `src/app/layout.tsx` | Root layout — sidebar + header shell, pull context provider |
| `src/app/globals.css` | Tailwind directives + dark theme CSS variables |
| `bin/cli.js` | CLI entrypoint for `npx myollama` |

### Shared Libraries
| File | Responsibility |
|------|---------------|
| `src/types/index.ts` | All shared TypeScript types (Ollama API, catalog, config) |
| `src/lib/ollama.ts` | Typed Ollama API client (server-side, used by API routes) |
| `src/lib/config.ts` | Read/write `~/.myollama/config.json` (server-side only) |
| `src/lib/catalog.ts` | Load and search the curated model catalog |
| `src/lib/format.ts` | Shared formatting utilities (formatBytes, formatDate) |
| `data/catalog.json` | Bundled curated catalog (~50 models) |

### API Routes
| File | Responsibility |
|------|---------------|
| `src/app/api/ollama/tags/route.ts` | Proxy `GET /api/tags` → list installed models |
| `src/app/api/ollama/show/route.ts` | Proxy `POST /api/show` → model details |
| `src/app/api/ollama/pull/route.ts` | Proxy `POST /api/pull` → streaming pull progress |
| `src/app/api/ollama/delete/route.ts` | Proxy `DELETE /api/delete` → remove model |
| `src/app/api/ollama/create/route.ts` | Proxy `POST /api/create` → create from structured params |
| `src/app/api/catalog/route.ts` | Serve + search curated catalog |
| `src/app/api/settings/route.ts` | GET/PUT app settings |
| `src/app/api/settings/test/route.ts` | Server-side Ollama connection test |
| `src/app/api/modelfiles/route.ts` | CRUD saved Modelfile drafts |

### UI Components
| File | Responsibility |
|------|---------------|
| `src/components/sidebar.tsx` | Navigation sidebar (Library, Models, Modelfiles, Settings) |
| `src/components/header.tsx` | Top bar with app name, endpoint URL, health indicator |
| `src/components/model-card.tsx` | Library model card (name, desc, tags, pull button, progress) |
| `src/components/tag-selector.tsx` | Dropdown for selecting model tag before pull |
| `src/components/pull-progress.tsx` | Progress bar with percentage, speed display |
| `src/components/model-list-item.tsx` | Installed model row (name, size, date, expand, delete) |
| `src/components/model-details.tsx` | Expanded model info (template, params, license) |
| `src/components/modelfile-form.tsx` | Left panel: form for creating model variants |
| `src/components/modelfile-preview.tsx` | Right panel: live JSON preview |
| `src/components/connection-status.tsx` | Health indicator dot + tooltip |
| `src/components/pull-by-name.tsx` | Bottom bar input for manual model:tag pulls |
| `src/components/confirm-dialog.tsx` | Reusable confirmation dialog |

### Contexts
| File | Responsibility |
|------|---------------|
| `src/contexts/pull-context.tsx` | Global pull state provider — tracks active downloads across pages |
| `src/contexts/connection-context.tsx` | Global Ollama connection status |

### Pages
| File | Responsibility |
|------|---------------|
| `src/app/page.tsx` | Model Library Browser page |
| `src/app/models/page.tsx` | Installed Models Dashboard page |
| `src/app/modelfiles/page.tsx` | Modelfile Editor page |
| `src/app/settings/page.tsx` | Settings page |

### shadcn/ui Components (installed via CLI)
| Component | Usage |
|-----------|-------|
| `button` | All buttons |
| `input` | Search bar, text inputs |
| `card` | Model cards, list items |
| `dialog` | Confirm dialogs, tag selector |
| `dropdown-menu` | Tag selection |
| `slider` | Parameter tuning (temperature, top_p, etc.) |
| `badge` | "Installed" badge, category tags |
| `toast` / `sonner` | Notifications (pull errors, success) |
| `scroll-area` | Scrollable model lists |
| `separator` | Visual dividers |
| `tooltip` | Connection status, button hints |
| `progress` | Pull progress bar |

---

## Chunk 1: Project Scaffolding & Core Infrastructure

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Scaffold Next.js app**

Run:
```bash
cd C:/Users/me/dev/personal/myollama
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

When prompted, accept defaults. This creates the full Next.js 15 scaffold.

- [ ] **Step 2: Verify scaffold runs**

Run: `npm run dev`
Expected: Dev server starts on http://localhost:3000, default Next.js page loads.
Kill the dev server after verifying.

- [ ] **Step 3: Set standalone output in next.config.ts**

Replace `next.config.ts` contents:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 4: Commit scaffold**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with TypeScript and Tailwind"
```

---

### Task 2: Install shadcn/ui and Base Components

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/*`

- [ ] **Step 1: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init -d
```

This creates `components.json` and `src/lib/utils.ts`. Accept defaults (New York style, zinc base color, CSS variables).

- [ ] **Step 2: Install all needed shadcn/ui components**

Run:
```bash
npx shadcn@latest add button input card dialog dropdown-menu slider badge scroll-area separator tooltip progress sonner
```

- [ ] **Step 3: Verify components installed**

Run: `ls src/components/ui/`
Expected: Files for each component listed above.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: install shadcn/ui with all required components"
```

---

### Task 3: Dark Theme + Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Set up dark theme CSS variables in globals.css**

Replace `src/app/globals.css` with dark-only theme. The shadcn/ui init will have created CSS variable blocks — keep the `:root` block as the dark theme defaults (no light mode). Set the `body` background to the dark background color. Remove any `@media (prefers-color-scheme)` blocks.

Key customizations beyond shadcn defaults:
- Background: very dark (`#0a0a0a` / near-black)
- Card backgrounds: `#111111`
- Accent color: purple (`#a78bfa` / violet-400) to differentiate from generic shadcn apps
- Sidebar background: slightly lighter than body

- [ ] **Step 2: Update root layout for dark mode**

Modify `src/app/layout.tsx`:
- Set `<html lang="en" className="dark">` (force dark mode)
- Set appropriate metadata: title "MyOllama", description "Ollama Model Management"
- Import the Geist font (already included by create-next-app)

- [ ] **Step 3: Verify dark theme**

Run: `npm run dev`
Expected: Page loads with dark background. No white flash.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx tailwind.config.ts
git commit -m "feat: configure dark theme with purple accent"
```

---

### Task 4: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Define all shared types**

Create `src/types/index.ts`:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript types for Ollama API, catalog, config, and UI state"
```

---

### Task 5: Config File Library

**Files:**
- Create: `src/lib/config.ts`

- [ ] **Step 1: Implement config read/write**

Create `src/lib/config.ts`:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/config.ts
git commit -m "feat: add config file library for ~/.myollama/config.json"
```

---

### Task 6: Ollama API Client

**Files:**
- Create: `src/lib/ollama.ts`

- [ ] **Step 1: Implement typed Ollama client**

Create `src/lib/ollama.ts`:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ollama.ts
git commit -m "feat: add typed Ollama API client"
```

---

### Task 7: Catalog Data + Search Library

**Files:**
- Create: `data/catalog.json`
- Create: `src/lib/catalog.ts`

- [ ] **Step 1: Create curated catalog JSON**

Create `data/catalog.json` with ~30 popular models. Each entry needs: name, description, categories, tags, default_tag, url. Include at minimum:

- llama3.3, llama3.2, llama3.1
- qwen3, qwen2.5, qwen2.5-coder
- gemma3, gemma2
- deepseek-r1, deepseek-coder-v2
- phi4, phi3
- mistral, mixtral
- codellama, starcoder2
- llava, llama3.2-vision (vision category)
- nomic-embed-text, mxbai-embed-large (embedding category)
- command-r, aya

Structure:
```json
{
  "models": [
    {
      "name": "llama3.3",
      "description": "Meta's latest Llama model with improved reasoning and instruction following.",
      "categories": ["chat"],
      "tags": ["latest", "70b", "70b-instruct-q4_K_M", "70b-instruct-fp16"],
      "default_tag": "latest",
      "size_category": "large",
      "url": "https://ollama.com/library/llama3.3"
    }
  ]
}
```

- [ ] **Step 2: Verify tsconfig.json has resolveJsonModule**

Check that `tsconfig.json` has `"resolveJsonModule": true` (needed for importing `catalog.json`). This is typically set by `create-next-app` but verify it.

- [ ] **Step 3: Implement catalog search/filter**

Create `src/lib/catalog.ts`:

```ts
import catalogData from "../../data/catalog.json";
import type { Catalog, CatalogModel, CategoryFilter, SizeFilter } from "@/types";

const catalog: Catalog = catalogData as Catalog;

export function searchCatalog(
  query: string,
  category: CategoryFilter = "all",
  size: SizeFilter = "all"
): CatalogModel[] {
  let results = catalog.models;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.categories.some((c) => c.toLowerCase().includes(q))
    );
  }

  if (category !== "all") {
    results = results.filter((m) => m.categories.includes(category));
  }

  if (size !== "all") {
    results = results.filter((m) => m.size_category === size);
  }

  return results;
}

export function getAllModels(): CatalogModel[] {
  return catalog.models;
}
```

- [ ] **Step 4: Commit**

```bash
git add data/catalog.json src/lib/catalog.ts
git commit -m "feat: add curated model catalog with search and filtering"
```

---

### Task 8: API Routes — Ollama Proxy

**Files:**
- Create: `src/app/api/ollama/tags/route.ts`
- Create: `src/app/api/ollama/show/route.ts`
- Create: `src/app/api/ollama/pull/route.ts`
- Create: `src/app/api/ollama/delete/route.ts`
- Create: `src/app/api/ollama/create/route.ts`

- [ ] **Step 1: Tags route (list models)**

Create `src/app/api/ollama/tags/route.ts`:

```ts
import { NextResponse } from "next/server";
import { listModels } from "@/lib/ollama";

export async function GET() {
  try {
    const data = await listModels();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect to Ollama" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Show route (model details)**

Create `src/app/api/ollama/show/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { showModel } from "@/lib/ollama";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await showModel(body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get model details" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 3: Pull route (streaming download)**

Create `src/app/api/ollama/pull/route.ts`:

```ts
import { NextRequest } from "next/server";
import { pullModel } from "@/lib/ollama";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await pullModel(body);

    if (!response.body) {
      return new Response("No response body from Ollama", { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Pull failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

- [ ] **Step 4: Delete route**

Create `src/app/api/ollama/delete/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { deleteModel } from "@/lib/ollama";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    await deleteModel(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 5: Create route (streaming model build)**

Create `src/app/api/ollama/create/route.ts`:

```ts
import { NextRequest } from "next/server";
import { createModel } from "@/lib/ollama";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await createModel(body);

    if (!response.body) {
      return new Response("No response body from Ollama", { status: 502 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Create failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ollama/
git commit -m "feat: add Ollama proxy API routes (tags, show, pull, delete, create)"
```

---

### Task 9: API Routes — Catalog, Settings, Modelfiles

**Files:**
- Create: `src/app/api/catalog/route.ts`
- Create: `src/app/api/settings/route.ts`
- Create: `src/app/api/modelfiles/route.ts`

- [ ] **Step 1: Catalog route**

Create `src/app/api/catalog/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { searchCatalog, getAllModels } from "@/lib/catalog";
import type { CategoryFilter, SizeFilter } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = (searchParams.get("category") || "all") as CategoryFilter;
  const size = (searchParams.get("size") || "all") as SizeFilter;

  const models = query || category !== "all" || size !== "all"
    ? searchCatalog(query, category, size)
    : getAllModels();

  return NextResponse.json({ models });
}
```

- [ ] **Step 2: Settings route**

Create `src/app/api/settings/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getConfig, setOllamaUrl } from "@/lib/config";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({ ollamaUrl: config.ollamaUrl });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  if (body.ollamaUrl) {
    await setOllamaUrl(body.ollamaUrl);
  }
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Settings test route (server-side connection test)**

Create `src/app/api/settings/test/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body.url?.replace(/\/$/, "");
    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return NextResponse.json({ connected: false, error: "Invalid URL" }, { status: 400 });
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return NextResponse.json({ connected: res.ok });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
```

- [ ] **Step 4: Modelfiles route**

Create `src/app/api/modelfiles/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getModelfiles, saveModelfile, deleteModelfile } from "@/lib/config";

export async function GET() {
  const modelfiles = await getModelfiles();
  return NextResponse.json({ modelfiles });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  await saveModelfile({
    ...body,
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  await deleteModelfile(body.name);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/catalog/ src/app/api/settings/ src/app/api/modelfiles/
git commit -m "feat: add catalog, settings, and modelfiles API routes"
```

---

### Task 10: App Shell — Sidebar + Header + Layout

**Files:**
- Create: `src/components/sidebar.tsx`
- Create: `src/components/header.tsx`
- Create: `src/components/connection-status.tsx`
- Create: `src/contexts/connection-context.tsx`
- Create: `src/contexts/pull-context.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Connection context**

Create `src/contexts/connection-context.tsx`:

```tsx
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
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
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
```

- [ ] **Step 2: Pull context**

Create `src/contexts/pull-context.tsx`:

```tsx
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
```

- [ ] **Step 3: Connection status indicator**

Create `src/components/connection-status.tsx`:

```tsx
"use client";

import { useConnection } from "@/contexts/connection-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const { status, ollamaUrl } = useConnection();

  const color = status === "connected"
    ? "bg-green-500"
    : status === "disconnected"
    ? "bg-red-500"
    : "bg-yellow-500 animate-pulse";

  const label = status === "connected"
    ? `Connected to ${ollamaUrl}`
    : status === "disconnected"
    ? `Cannot connect to ${ollamaUrl}`
    : "Checking connection...";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`h-2 w-2 rounded-full ${color}`} />
            <span className="hidden sm:inline truncate max-w-[200px]">{ollamaUrl}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

- [ ] **Step 4: Header component**

Create `src/components/header.tsx`:

```tsx
import { ConnectionStatus } from "./connection-status";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <h1 className="text-lg font-bold tracking-tight">MyOllama</h1>
      <ConnectionStatus />
    </header>
  );
}
```

- [ ] **Step 5: Sidebar component**

Create `src/components/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, HardDrive, FileCode, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Library", icon: Package },
  { href: "/models", label: "Models", icon: HardDrive },
  { href: "/modelfiles", label: "Modelfiles", icon: FileCode },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card/50">
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="text-xl font-bold tracking-tight">🦙</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 6: Wire up root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { ConnectionProvider } from "@/contexts/connection-context";
import { PullProvider } from "@/contexts/pull-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyOllama",
  description: "Ollama Model Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ConnectionProvider>
          <PullProvider>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-6">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </PullProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Verify app shell renders**

Run: `npm run dev`
Expected: Dark page with sidebar (Library, Models, Modelfiles, Settings links), header bar with "MyOllama" and connection status indicator. Sidebar navigation works between pages.

- [ ] **Step 8: Commit**

```bash
git add src/contexts/ src/components/sidebar.tsx src/components/header.tsx src/components/connection-status.tsx src/app/layout.tsx
git commit -m "feat: add app shell with sidebar, header, connection status, and pull context"
```

---

## Chunk 2: Model Library Browser (Feature 1)

### Task 11: Model Card Component

**Files:**
- Create: `src/components/model-card.tsx`
- Create: `src/components/pull-progress.tsx`
- Create: `src/components/tag-selector.tsx`

- [ ] **Step 1: Pull progress component**

Create `src/components/pull-progress.tsx`:

```tsx
"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { PullState } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e9).toFixed(1)} GB`;
}

export function PullProgress({ state, onRetry }: { state: PullState; onRetry?: () => void }) {
  const percent = state.total && state.completed
    ? Math.round((state.completed / state.total) * 100)
    : 0;

  if (state.status === "failed") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-destructive flex-1">
          Failed: {state.error || "Unknown error"}
        </span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1">
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        )}
      </div>
    );
  }

  if (state.status === "success") {
    return <div className="text-sm text-green-500">Downloaded successfully</div>;
  }

  if (state.status === "verifying") {
    return <div className="text-sm text-muted-foreground animate-pulse">Verifying...</div>;
  }

  if (state.status === "downloading" && state.total) {
    return (
      <div className="space-y-1">
        <Progress value={percent} className="h-1.5" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatBytes(state.completed || 0)} / {formatBytes(state.total)}</span>
          <span>{percent}%</span>
        </div>
      </div>
    );
  }

  return <div className="text-sm text-muted-foreground animate-pulse">Pulling manifest...</div>;
}
```

- [ ] **Step 2: Tag selector component**

Create `src/components/tag-selector.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { CatalogModel } from "@/types";

interface TagSelectorProps {
  model: CatalogModel;
  onSelect: (fullName: string) => void;
  disabled?: boolean;
}

export function TagSelector({ model, onSelect, disabled }: TagSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={disabled} className="gap-1">
          Pull <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {model.tags.map((tag) => (
          <DropdownMenuItem
            key={tag}
            onClick={() => {
              onSelect(`${model.name}:${tag}`);
              setOpen(false);
            }}
          >
            {model.name}:{tag}
            {tag === model.default_tag && (
              <span className="ml-2 text-xs text-muted-foreground">(default)</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <a href={model.url} target="_blank" rel="noopener noreferrer" className="gap-2">
            All tags <ExternalLink className="h-3 w-3" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 3: Model card component**

Create `src/components/model-card.tsx`:

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagSelector } from "./tag-selector";
import { PullProgress } from "./pull-progress";
import { usePull } from "@/contexts/pull-context";
import { useConnection } from "@/contexts/connection-context";
import type { CatalogModel } from "@/types";

interface ModelCardProps {
  model: CatalogModel;
  isInstalled: boolean;
}

export function ModelCard({ model, isInstalled }: ModelCardProps) {
  const { pulls, startPull } = usePull();
  const { status: connStatus } = useConnection();

  // Find any active pull for this model (pulls are keyed by full "model:tag" string)
  const pullState = Array.from(pulls.values()).find(
    (p) => p.model === model.name || p.model.startsWith(`${model.name}:`)
  );
  const isPulling = pullState && pullState.status !== "success" && pullState.status !== "idle";

  return (
    <Card className="transition-colors hover:border-border/80">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground">{model.name}</h3>
          {isInstalled && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
              Installed
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {model.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {model.categories.map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs">
              {cat}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {model.tags.filter((t) => t.match(/^\d+b/)).join(", ") || model.default_tag}
          </Badge>
        </div>

        {isPulling && pullState ? (
          <PullProgress state={pullState} onRetry={() => startPull(pullState.model)} />
        ) : pullState?.status === "failed" ? (
          <PullProgress state={pullState} onRetry={() => startPull(pullState.model)} />
        ) : (
          <TagSelector
            model={model}
            onSelect={startPull}
            disabled={connStatus !== "connected"}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/model-card.tsx src/components/pull-progress.tsx src/components/tag-selector.tsx
git commit -m "feat: add model card with tag selector and pull progress"
```

---

### Task 12: Pull-by-Name Bar + Library Page

**Files:**
- Create: `src/components/pull-by-name.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Pull-by-name bar**

Create `src/components/pull-by-name.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePull } from "@/contexts/pull-context";
import { useConnection } from "@/contexts/connection-context";

export function PullByName() {
  const [model, setModel] = useState("");
  const { startPull } = usePull();
  const { status } = useConnection();

  const handlePull = () => {
    if (!model.trim()) return;
    startPull(model.trim());
    setModel("");
  };

  return (
    <div className="flex items-center gap-3 border-t border-border pt-4">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Pull by name:</span>
      <Input
        value={model}
        onChange={(e) => setModel(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handlePull()}
        placeholder="e.g., mistral:7b-instruct-q4_K_M"
        className="flex-1"
      />
      <Button
        onClick={handlePull}
        disabled={!model.trim() || status !== "connected"}
        size="sm"
        className="gap-2"
      >
        <Download className="h-4 w-4" /> Pull
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Library page**

Replace `src/app/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ModelCard } from "@/components/model-card";
import { PullByName } from "@/components/pull-by-name";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogModel, OllamaModel, CategoryFilter, SizeFilter } from "@/types";

const categories: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chat", label: "Chat" },
  { value: "code", label: "Code" },
  { value: "vision", label: "Vision" },
  { value: "embedding", label: "Embedding" },
];

const sizes: { value: SizeFilter; label: string }[] = [
  { value: "all", label: "All Sizes" },
  { value: "small", label: "Small (<4B)" },
  { value: "medium", label: "Medium (4-13B)" },
  { value: "large", label: "Large (13B+)" },
];

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [size, setSize] = useState<SizeFilter>("all");
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [installedNames, setInstalledNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (size !== "all") params.set("size", size);

    fetch(`/api/catalog?${params}`)
      .then((r) => r.json())
      .then((data) => setModels(data.models));
  }, [query, category, size]);

  useEffect(() => {
    fetch("/api/ollama/tags")
      .then((r) => r.json())
      .then((data) => {
        if (data.models) {
          const names = new Set<string>(
            data.models.map((m: OllamaModel) => m.name.split(":")[0])
          );
          setInstalledNames(names);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Model Library</h2>
        <div className="flex-1" />
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search models (e.g., "llama3", "code")...'
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Badge
            key={cat.value}
            variant={category === cat.value ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              category === cat.value && "bg-primary text-primary-foreground"
            )}
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
        <div className="w-px bg-border mx-1" />
        {sizes.map((s) => (
          <Badge
            key={s.value}
            variant={size === s.value ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              size === s.value && "bg-primary text-primary-foreground"
            )}
            onClick={() => setSize(s.value)}
          >
            {s.label}
          </Badge>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {models.map((model) => (
            <ModelCard
              key={model.name}
              model={model}
              isInstalled={installedNames.has(model.name)}
            />
          ))}
        </div>
        {models.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No models found matching your search.
          </div>
        )}
      </div>

      <PullByName />
    </div>
  );
}
```

- [ ] **Step 3: Verify library page renders**

Run: `npm run dev`
Expected: Model Library page with search bar, filter pills, model cards grid, and pull-by-name bar at the bottom. Cards show model names, descriptions, and pull buttons.

- [ ] **Step 4: Commit**

```bash
git add src/components/pull-by-name.tsx src/app/page.tsx
git commit -m "feat: add Model Library page with search, filters, and pull-by-name"
```

---

## Chunk 3: Installed Models Dashboard (Feature 2)

### Task 13: Model List Item + Details Components

**Files:**
- Create: `src/components/model-list-item.tsx`
- Create: `src/components/model-details.tsx`
- Create: `src/components/confirm-dialog.tsx`

- [ ] **Step 1: Confirm dialog**

Create `src/components/confirm-dialog.tsx`:

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Model details component**

Create `src/components/model-details.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OllamaShowResponse } from "@/types";

export function ModelDetails({ modelName }: { modelName: string }) {
  const [details, setDetails] = useState<OllamaShowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ollama/show", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelName }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load details");
        return r.json();
      })
      .then(setDetails)
      .catch((e) => setError(e.message));
  }, [modelName]);

  if (error) return <p className="text-sm text-destructive py-2">{error}</p>;
  if (!details) return <p className="text-sm text-muted-foreground py-2 animate-pulse">Loading details...</p>;

  const sections = [
    { label: "Family", value: details.details.family },
    { label: "Parameter Size", value: details.details.parameter_size },
    { label: "Quantization", value: details.details.quantization_level },
    { label: "Format", value: details.details.format },
  ];

  return (
    <div className="space-y-3 py-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sections.map((s) => (
          <div key={s.label}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-sm font-medium">{s.value || "—"}</p>
          </div>
        ))}
      </div>

      {details.system && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">System Prompt</p>
            <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
              {details.system}
            </pre>
          </div>
        </>
      )}

      {details.parameters && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Parameters</p>
            <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
              {details.parameters}
            </pre>
          </div>
        </>
      )}

      {details.template && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Template</p>
            <ScrollArea className="max-h-32">
              <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
                {details.template}
              </pre>
            </ScrollArea>
          </div>
        </>
      )}

      {details.license && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">License</p>
            <ScrollArea className="max-h-24">
              <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                {details.license}
              </pre>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Model list item component**

Create `src/components/model-list-item.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { ConfirmDialog } from "./confirm-dialog";
import { ModelDetails } from "./model-details";
import { toast } from "sonner";
import type { OllamaModel } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e9).toFixed(1)} GB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ModelListItemProps {
  model: OllamaModel;
  onDeleted: () => void;
}

export function ModelListItem({ model, onDeleted }: ModelListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/ollama/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      toast.success(`Deleted ${model.name}`);
      onDeleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{model.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(model.modified_at)}
              </p>
            </div>

            <Badge variant="outline" className="text-xs">
              {model.details.family}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {model.details.parameter_size}
            </Badge>
            <span className="text-sm text-muted-foreground tabular-nums w-20 text-right">
              {formatBytes(model.size)}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {expanded && <ModelDetails modelName={model.name} />}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${model.name}?`}
        description={`This will free ${formatBytes(model.size)}. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/model-list-item.tsx src/components/model-details.tsx src/components/confirm-dialog.tsx
git commit -m "feat: add model list item with expandable details and delete confirmation"
```

---

### Task 14: Installed Models Page

**Files:**
- Create: `src/app/models/page.tsx`

- [ ] **Step 1: Installed models page**

Create `src/app/models/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ModelListItem } from "@/components/model-list-item";
import { RefreshCw, Package } from "lucide-react";
import { useConnection } from "@/contexts/connection-context";
import Link from "next/link";
import type { OllamaModel } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e9).toFixed(1)} GB`;
}

export default function ModelsPage() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status } = useConnection();

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ollama/tags");
      if (!res.ok) throw new Error("Failed to connect to Ollama");
      const data = await res.json();
      setModels(data.models || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const totalSize = models.reduce((sum, m) => sum + m.size, 0);

  if (error || status === "disconnected") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <p>Cannot connect to Ollama.</p>
        <Link href="/settings">
          <Button variant="outline">Check Settings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Installed Models</h2>
          <p className="text-sm text-muted-foreground">
            {models.length} model{models.length !== 1 ? "s" : ""} · {formatBytes(totalSize)} total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchModels} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {models.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
          <Package className="h-12 w-12" />
          <p>No models installed yet.</p>
          <Link href="/">
            <Button variant="outline">Browse the Library</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {models.map((model) => (
            <ModelListItem
              key={model.digest}
              model={model}
              onDeleted={fetchModels}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify models page**

Run: `npm run dev`, navigate to `/models`.
Expected: If Ollama is running, shows installed models list. If not, shows connection error with link to Settings. Empty state shows "Browse the Library" link.

- [ ] **Step 3: Commit**

```bash
git add src/app/models/page.tsx
git commit -m "feat: add Installed Models dashboard page"
```

---

## Chunk 4: Modelfile Editor (Feature 3)

### Task 15: Modelfile Form + Preview Components

**Files:**
- Create: `src/components/modelfile-form.tsx`
- Create: `src/components/modelfile-preview.tsx`

- [ ] **Step 1: Modelfile preview (right panel)**

Create `src/components/modelfile-preview.tsx`:

```tsx
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { OllamaCreateRequest } from "@/types";

export function ModelfilePreview({ request }: { request: OllamaCreateRequest }) {
  const json = JSON.stringify(request, null, 2);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground">API Request Preview</h3>
      </div>
      <ScrollArea className="flex-1">
        <pre className="p-4 text-sm font-mono text-muted-foreground leading-relaxed">
          {json}
        </pre>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 2: Modelfile form (left panel)**

Create `src/components/modelfile-form.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Save, Play } from "lucide-react";
import { toast } from "sonner";
import type { OllamaModel, OllamaCreateRequest, ModelfileDraft } from "@/types";

interface ModelfileFormProps {
  draft: ModelfileDraft | null;
  installedModels: OllamaModel[];
  onRequestChange: (request: OllamaCreateRequest) => void;
  onSaved: () => void;
}

export function ModelfileForm({
  draft,
  installedModels,
  onRequestChange,
  onSaved,
}: ModelfileFormProps) {
  const [name, setName] = useState(draft?.name || "");
  const [from, setFrom] = useState(draft?.from || "");
  const [system, setSystem] = useState(draft?.system || "");
  const [temperature, setTemperature] = useState(draft?.parameters.temperature ?? 0.7);
  const [topP, setTopP] = useState(draft?.parameters.top_p ?? 0.9);
  const [topK, setTopK] = useState(draft?.parameters.top_k ?? 40);
  const [contextLength, setContextLength] = useState(draft?.parameters.num_ctx ?? 4096);
  const [repeatPenalty, setRepeatPenalty] = useState(draft?.parameters.repeat_penalty ?? 1.1);
  const [building, setBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState<string | null>(null);

  useEffect(() => {
    if (draft) {
      setName(draft.name);
      setFrom(draft.from);
      setSystem(draft.system);
      setTemperature(draft.parameters.temperature ?? 0.7);
      setTopP(draft.parameters.top_p ?? 0.9);
      setTopK(draft.parameters.top_k ?? 40);
      setContextLength(draft.parameters.num_ctx ?? 4096);
      setRepeatPenalty(draft.parameters.repeat_penalty ?? 1.1);
    }
  }, [draft]);

  useEffect(() => {
    const request: OllamaCreateRequest = {
      model: name || "my-model",
      from: from || "base-model",
    };
    if (system) request.system = system;
    const params: Record<string, number> = {};
    if (temperature !== 0.7) params.temperature = temperature;
    if (topP !== 0.9) params.top_p = topP;
    if (topK !== 40) params.top_k = topK;
    if (contextLength !== 4096) params.num_ctx = contextLength;
    if (repeatPenalty !== 1.1) params.repeat_penalty = repeatPenalty;
    if (Object.keys(params).length > 0) request.parameters = params;
    onRequestChange(request);
  }, [name, from, system, temperature, topP, topK, contextLength, repeatPenalty, onRequestChange]);

  const handleSave = async () => {
    if (!name || !from) {
      toast.error("Model name and base model are required");
      return;
    }
    try {
      await fetch("/api/modelfiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          from,
          system,
          parameters: { temperature, top_p: topP, top_k: topK, num_ctx: contextLength, repeat_penalty: repeatPenalty },
        }),
      });
      toast.success("Draft saved");
      onSaved();
    } catch {
      toast.error("Failed to save draft");
    }
  };

  const handleBuild = async () => {
    if (!name || !from) {
      toast.error("Model name and base model are required");
      return;
    }
    setBuilding(true);
    setBuildStatus("Starting build...");
    try {
      const request: OllamaCreateRequest = { model: name, from };
      if (system) request.system = system;
      const params: Record<string, number> = {};
      if (temperature !== 0.7) params.temperature = temperature;
      if (topP !== 0.9) params.top_p = topP;
      if (topK !== 40) params.top_k = topK;
      if (contextLength !== 4096) params.num_ctx = contextLength;
      if (repeatPenalty !== 1.1) params.repeat_penalty = repeatPenalty;
      if (Object.keys(params).length > 0) request.parameters = params;

      const res = await fetch("/api/ollama/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok || !res.body) throw new Error("Build request failed");

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
            setBuildStatus(data.status || "Building...");
          } catch { /* skip */ }
        }
      }

      toast.success(`Model ${name} created successfully`);
      setBuildStatus(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Build failed");
      setBuildStatus(null);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Model Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-custom-model"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Base Model</label>
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select a base model...</option>
          {installedModels.map((m) => (
            <option key={m.name} value={m.name}>{m.name}</option>
          ))}
        </select>
        {installedModels.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            No models installed. Pull a model from the Library first.
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">System Prompt</label>
        <textarea
          value={system}
          onChange={(e) => setSystem(e.target.value)}
          placeholder="You are a helpful assistant..."
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y min-h-[80px]"
        />
      </div>

      <Separator />

      <h3 className="text-sm font-medium">Parameters</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Temperature</span>
            <span className="text-muted-foreground tabular-nums">{temperature.toFixed(2)}</span>
          </div>
          <Slider
            value={[temperature]}
            onValueChange={([v]) => setTemperature(v)}
            min={0}
            max={2}
            step={0.05}
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Top P</span>
            <span className="text-muted-foreground tabular-nums">{topP.toFixed(2)}</span>
          </div>
          <Slider
            value={[topP]}
            onValueChange={([v]) => setTopP(v)}
            min={0}
            max={1}
            step={0.05}
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Top K</span>
            <span className="text-muted-foreground tabular-nums">{topK}</span>
          </div>
          <Input
            type="number"
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            min={1}
            max={100}
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Context Length</span>
            <span className="text-muted-foreground tabular-nums">{contextLength}</span>
          </div>
          <Input
            type="number"
            value={contextLength}
            onChange={(e) => setContextLength(Number(e.target.value))}
            min={512}
            max={131072}
            step={512}
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Repeat Penalty</span>
            <span className="text-muted-foreground tabular-nums">{repeatPenalty.toFixed(2)}</span>
          </div>
          <Slider
            value={[repeatPenalty]}
            onValueChange={([v]) => setRepeatPenalty(v)}
            min={0.5}
            max={2}
            step={0.05}
          />
        </div>
      </div>

      <Separator />

      {buildStatus && (
        <p className="text-sm text-muted-foreground animate-pulse">{buildStatus}</p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> Save Draft
        </Button>
        <Button onClick={handleBuild} disabled={building || !name || !from} className="gap-2">
          <Play className="h-4 w-4" /> {building ? "Building..." : "Build"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/modelfile-form.tsx src/components/modelfile-preview.tsx
git commit -m "feat: add Modelfile form and JSON preview components"
```

---

### Task 16: Modelfile Editor Page

**Files:**
- Create: `src/app/modelfiles/page.tsx`

- [ ] **Step 1: Modelfile editor page**

Create `src/app/modelfiles/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ModelfileForm } from "@/components/modelfile-form";
import { ModelfilePreview } from "@/components/modelfile-preview";
import { Plus, FileCode, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { OllamaModel, OllamaCreateRequest, ModelfileDraft } from "@/types";

export default function ModelfilesPage() {
  const [drafts, setDrafts] = useState<ModelfileDraft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<ModelfileDraft | null>(null);
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [request, setRequest] = useState<OllamaCreateRequest>({ model: "my-model", from: "base-model" });

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/modelfiles");
      const data = await res.json();
      setDrafts(data.modelfiles || []);
    } catch { /* ignore */ }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/ollama/tags");
      const data = await res.json();
      setInstalledModels(data.models || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchDrafts();
    fetchModels();
  }, [fetchDrafts, fetchModels]);

  const handleDeleteDraft = async (name: string) => {
    try {
      await fetch("/api/modelfiles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      toast.success("Draft deleted");
      if (selectedDraft?.name === name) setSelectedDraft(null);
      fetchDrafts();
    } catch {
      toast.error("Failed to delete draft");
    }
  };

  return (
    <div className="flex h-full gap-0 -m-6">
      {/* Draft list sidebar */}
      <div className="w-56 border-r border-border flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-sm font-medium">Drafts</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDraft(null)}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {drafts.map((d) => (
            <div
              key={d.name}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/50 group",
                selectedDraft?.name === d.name && "bg-accent"
              )}
              onClick={() => setSelectedDraft(d)}
            >
              <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm truncate flex-1">{d.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDraft(d.name);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {drafts.length === 0 && (
            <p className="text-xs text-muted-foreground p-3">
              No saved drafts. Create one using the form.
            </p>
          )}
        </ScrollArea>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto">
        <ModelfileForm
          draft={selectedDraft}
          installedModels={installedModels}
          onRequestChange={setRequest}
          onSaved={fetchDrafts}
        />
      </div>

      {/* Preview */}
      <Separator orientation="vertical" />
      <div className="w-96 bg-card/30">
        <ModelfilePreview request={request} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify modelfile editor page**

Run: `npm run dev`, navigate to `/modelfiles`.
Expected: Three-pane layout — draft list on left, form in center, JSON preview on right. Form has base model dropdown, system prompt textarea, parameter sliders. JSON preview updates live.

- [ ] **Step 3: Commit**

```bash
git add src/app/modelfiles/page.tsx
git commit -m "feat: add Modelfile Editor page with draft list, form, and live preview"
```

---

## Chunk 5: Settings Page + CLI + Polish

### Task 17: Settings Page

**Files:**
- Create: `src/app/settings/page.tsx`

- [ ] **Step 1: Settings page**

Create `src/app/settings/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { useConnection } from "@/contexts/connection-context";

export default function SettingsPage() {
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"connected" | "failed" | null>(null);
  const { refresh } = useConnection();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setUrl(data.ollamaUrl));
  }, []);

  const handleTest = async () => {
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
  };

  const handleSave = async () => {
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ollamaUrl: url }),
      });
      toast.success("Settings saved");
      refresh();
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ollama Server URL</label>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setTestResult(null);
            }}
            placeholder="http://localhost:11434"
          />
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            <PlugZap className="h-4 w-4 mr-2" />
            {testing ? "Testing..." : "Test"}
          </Button>
        </div>
        {testResult && (
          <Badge variant={testResult === "connected" ? "default" : "destructive"}>
            {testResult === "connected" ? "Connected" : "Connection failed"}
          </Badge>
        )}
      </div>

      <Button onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" /> Save
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify settings page**

Run: `npm run dev`, navigate to `/settings`.
Expected: URL input with current value, Test button that pings the server, Save button that persists the change.

- [ ] **Step 3: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add Settings page with connection test"
```

---

### Task 18: CLI Entrypoint

**Files:**
- Create: `bin/cli.js`
- Modify: `package.json`

- [ ] **Step 1: Create CLI script**

Create `bin/cli.js`:

```js
#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  MyOllama - Ollama Model Management

  Usage: myollama [options]

  Options:
    --port, -p <port>   Port to run on (default: 3000)
    --host <host>        Host to bind to (default: 127.0.0.1)
    --version, -v        Show version
    --help, -h           Show this help message
  `);
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  const pkg = require("../package.json");
  console.log(pkg.version);
  process.exit(0);
}

function getArg(flags) {
  for (const flag of flags) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  }
  return null;
}

const port = getArg(["--port", "-p"]) || "3000";
const host = getArg(["--host"]) || "127.0.0.1";

const standaloneDir = path.join(__dirname, "..", ".next", "standalone");
const serverPath = path.join(standaloneDir, "server.js");

if (!fs.existsSync(serverPath)) {
  console.error("Error: Standalone server not found. Run 'npm run build' first.");
  process.exit(1);
}

// Copy static files if not already in place
const staticSrc = path.join(__dirname, "..", ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
}

const publicSrc = path.join(__dirname, "..", "public");
const publicDest = path.join(standaloneDir, "public");
if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
}

console.log(`🦙 MyOllama starting on http://${host}:${port}`);

const server = spawn("node", [serverPath], {
  env: { ...process.env, PORT: port, HOSTNAME: host },
  stdio: "inherit",
  cwd: standaloneDir,
});

server.on("error", (err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});

process.on("SIGINT", () => {
  server.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.kill("SIGTERM");
  process.exit(0);
});
```

- [ ] **Step 2: Update package.json**

Add these fields to `package.json` (merge with existing):

```json
{
  "bin": {
    "myollama": "./bin/cli.js"
  },
  "engines": {
    "node": ">=18.17.0"
  },
  "files": [
    "bin/",
    ".next/standalone/",
    ".next/static/",
    "public/",
    "data/"
  ]
}
```

Also ensure `scripts` includes:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prepublishOnly": "npm run build"
  }
}
```

- [ ] **Step 3: Verify CLI works locally**

Run:
```bash
npm run build
node bin/cli.js --port 4000
```
Expected: Server starts on http://127.0.0.1:4000, app is fully functional.

- [ ] **Step 4: Commit**

```bash
git add bin/cli.js package.json
git commit -m "feat: add CLI entrypoint for npx myollama"
```

---

### Task 19: Final Polish + Gitignore

**Files:**
- Create: `.gitignore`
- Modify: `src/app/globals.css` (if needed for polish tweaks)

- [ ] **Step 1: Create .gitignore**

Create `.gitignore`:

```
# dependencies
/node_modules
/.pnp
.pnp.js

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# superpowers
.superpowers/

# claude
.claude/
```

- [ ] **Step 2: Full smoke test**

Run: `npm run dev`
Test each page:
1. `/` — Library page loads, search filters work, pull-by-name bar present
2. `/models` — Installed models show (or empty state if no Ollama)
3. `/modelfiles` — Editor form renders, JSON preview updates live
4. `/settings` — URL input shows, test button works

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

### Task 20: Build Verification

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Build completes successfully with standalone output in `.next/standalone/`.

- [ ] **Step 2: Verify standalone server**

Run: `node bin/cli.js`
Expected: App runs on http://127.0.0.1:3000, all pages work.

- [ ] **Step 3: Run linting**

Run: `npm run lint`
Expected: No errors. Fix any that appear.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify production build and fix any lint issues"
```

---

## Execution Notes

- **Tasks 1-10** (Chunk 1) must be done sequentially — each builds on the previous.
- **Tasks 11-12** (Chunk 2), **Tasks 13-14** (Chunk 3), and **Tasks 15-16** (Chunk 4) can be done in parallel after Chunk 1 is complete, as they only depend on the shared infrastructure.
- **Tasks 17-20** (Chunk 5) depend on all previous chunks.
- The curated catalog (Task 7 Step 1) is a data entry task — the exact model list can be refined during implementation.
- If Ollama is not running locally during development, error states and empty states should still render correctly.
