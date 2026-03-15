# MyOllama — Design Specification

## Overview

MyOllama is a web-based Ollama model management tool — think LM Studio but locally hosted and browser-based. It provides a polished UI for browsing, downloading, managing, and configuring Ollama models.

**Distribution:** Published to npm, run via `npx myollama` (optionally `npx myollama --port 8080`).

**Target audience:** The broader Ollama community — anyone who wants a visual interface for managing their Ollama instance.

**Platform:** Desktop browsers only. Mobile layout is not a v1 goal.

## v1 Scope

Three features focused on model management:

1. **Model Library Browser** — Search, discover, and download models
2. **Installed Models Dashboard** — View, inspect, and delete installed models
3. **Modelfile Editor** — Create custom model variants visually

Future features (post-v1): Chat playground, parameter tuning, side-by-side model comparison, prompt templates, resource monitoring, request logs, multi-endpoint switching, API explorer, embedding tools, vision support, batch inference.

## Tech Stack

- **Framework:** Next.js 15 (App Router), TypeScript
- **UI:** Tailwind CSS + shadcn/ui, dark theme, LM Studio-level polish
- **Persistence:** JSON config file at `~/.myollama/config.json` for settings and Modelfile drafts (zero native dependencies)
- **Distribution:** npm package with `bin` entry, Next.js standalone output mode
- **Architecture:** Monolithic — single Next.js app, API routes proxy all Ollama requests

## Architecture

```
Browser  →  Next.js Server  →  Ollama Server
                │
          ~/.myollama/
            config.json
```

All Ollama API calls proxy through Next.js API routes. The browser never talks to Ollama directly. This solves CORS, enables request logging, and provides a clean error handling layer.

### Configurable Endpoint

The Ollama server URL is a user setting, not hardcoded:
- Default: `http://localhost:11434`
- Changeable via Settings page
- Persisted in `~/.myollama/config.json`
- Health check indicator in the header showing connection status

### Ollama API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tags` | GET | List installed models |
| `/api/show` | POST | Get model details (template, params, license) |
| `/api/pull` | POST | Download a model (streaming progress) |
| `/api/delete` | DELETE | Remove a model |
| `/api/create` | POST | Create model from structured params (streaming) |

### API Route Structure

```
src/app/api/
├── ollama/
│   ├── tags/route.ts        → Proxy GET /api/tags
│   ├── show/route.ts        → Proxy POST /api/show
│   ├── pull/route.ts        → Proxy POST /api/pull (SSE streaming)
│   ├── delete/route.ts      → Proxy DELETE /api/delete
│   └── create/route.ts      → Proxy POST /api/create (SSE streaming)
├── catalog/
│   └── route.ts             → Serve/search curated model catalog
├── settings/
│   └── route.ts             → CRUD for app settings
└── modelfiles/
    └── route.ts             → CRUD for saved Modelfile drafts
```

## Feature 1: Model Library Browser

### Purpose

Search, discover, and download Ollama models. Combines a curated catalog for browsing with a manual pull input for any model by name.

### UI Layout

- **Search bar** at the top — filters the curated catalog by name, description, and tags
- **Filter pills** below search — category filters: All, Chat, Code, Vision, Embedding, size ranges (Small <4B, Medium 4-13B, Large 13B+)
- **Model cards grid** — responsive grid of cards, each showing:
  - Model name
  - Short description
  - Size range and category tags
  - "Installed" badge if any variant is locally installed
  - "Pull Model" button (opens tag selector) or "View Tags" if already installed
- **Pull progress** — active downloads show a progress bar, speed, and percentage on the card
- **"Pull by name" bar** at the bottom — text input for pulling any model:tag not in the catalog

### Curated Catalog

A bundled JSON file (`data/catalog.json`) containing ~50 popular models:

```json
{
  "models": [
    {
      "name": "llama3.3",
      "description": "Meta's latest Llama model. Strong general-purpose performance with improved reasoning.",
      "categories": ["chat"],
      "tags": ["latest", "1b", "3b", "8b", "70b", "70b-instruct-q4_K_M"],
      "default_tag": "latest",
      "url": "https://ollama.com/library/llama3.3"
    }
  ]
}
```

The catalog is static and ships with the app. It can be updated by updating the npm package. This is a known limitation for v1 — post-v1 could optionally fetch catalog updates from a hosted URL on startup.

### Tag Selection

When a user clicks "Pull Model," a dropdown shows available tags from the catalog entry (e.g., `:latest`, `:8b`, `:70b-instruct-q4_K_M`). The `default_tag` is pre-selected. A link to the model's Ollama library page is shown for users who want to see all available tags beyond what the catalog lists.

For manual pulls via the bottom bar, the user types the full `model:tag` string directly.

### Pull Progress Streaming

The `/api/pull` Ollama endpoint returns a stream of JSON objects:

```json
{"status":"pulling manifest"}
{"status":"downloading","digest":"sha256:...","total":3200000000,"completed":2080000000}
{"status":"verifying sha256 digest"}
{"status":"writing manifest"}
{"status":"success"}
```

The API route proxies this as Server-Sent Events to the browser. The UI updates the card's progress bar in real time. Multiple concurrent pulls are supported — each card tracks its own download independently.

**Pull state management:** Active pull state is maintained in a React context provider at the app root, so pull progress persists across page navigation within the SPA. If the browser is closed mid-pull, the Ollama server continues the download — on next visit, the model will appear as installed.

### Error States

- **Ollama unreachable:** Cards show a disabled "Pull" button. Header health indicator shows red with message "Cannot connect to Ollama at [url]". Settings link offered.
- **Pull failure (network):** Card shows "Failed" state with a "Retry" button. The partial download is handled by Ollama (it resumes automatically on retry).
- **Pull failure (disk full):** Error message displayed on the card. No automatic retry.
- **Model not found (manual pull):** Toast notification: "Model 'xyz' not found in Ollama registry."

## Feature 2: Installed Models Dashboard

### Purpose

View all locally installed models with details, and manage them (inspect, delete).

### UI Layout

- **Header** showing model count and total storage used
- **Model list** — card list, each row showing:
  - Model name and tag (e.g., `qwen3:4b`)
  - File size
  - Model family / category
  - Last modified date
  - Expand button for details
  - Delete button (with confirmation dialog)
- **Refresh button** to re-fetch from Ollama

### Model Details (Expanded)

Clicking "Details" on a model expands to show information from `POST /api/show`:

- **Template:** The chat template the model uses
- **Parameters:** Default parameter values (temperature, top_p, etc.)
- **System prompt:** If one is baked in
- **License:** Model license text
- **Quantization:** Quantization level and format
- **Model size / parameter count**

### Delete Flow

1. User clicks delete icon
2. Confirmation dialog: "Delete qwen3:4b? This will free 1.7 GB."
3. On confirm, `DELETE /api/delete` is called
4. Model removed from list, storage total updated

### Error States

- **Ollama unreachable:** Page shows connection error with link to Settings. Model list is empty with a message explaining why.
- **Delete of loaded model:** If Ollama returns an error because the model is currently loaded, show: "Cannot delete — model is currently loaded. Unload it first or wait for it to idle."
- **Empty state:** When no models are installed, show a friendly message with a link to the Model Library: "No models installed yet. Browse the library to get started."

## Feature 3: Modelfile Editor

### Purpose

Create and edit Modelfiles visually to build custom model variants — set system prompts, adjust default parameters, and create named variants without writing Modelfile syntax by hand.

### UI Layout — Split Pane

- **Left panel (Form editor):**
  - Base model dropdown (populated from installed models)
  - System prompt text area
  - Parameter controls: Temperature (slider), Top P (slider), Top K (number input), Context Length (number input), Repeat Penalty (slider)
  - Model name input (e.g., `my-coder:latest`)
  - Save Draft / Build buttons

- **Right panel (Live preview):**
  - Read-only JSON preview showing the structured request body that will be sent to `POST /api/create`
  - Updates in real time as the user changes form values

The Ollama `/api/create` endpoint accepts structured parameters:

```json
{
  "model": "my-coder",
  "from": "qwen3:4b",
  "system": "You are a helpful coding assistant...",
  "parameters": {
    "temperature": 0.7,
    "top_p": 0.9
  }
}
```

The form fields map directly to this structure. The right panel shows this JSON as a live preview.

### Build Flow

1. User fills out the form
2. Right panel shows live JSON preview of the create request
3. User clicks "Build" → `POST /api/create` with the structured body
4. Build progress streams inline (similar to pull progress)
5. On success, the new model appears in the Installed Models dashboard

### Persistence

- Modelfile drafts are saved to `~/.myollama/config.json` with name, base model, system prompt, and parameters
- User can load, edit, and re-build saved drafts
- Loading an installed model's details pre-populates the editor (extract from `POST /api/show`)

### Error States

- **No installed models:** Base model dropdown is empty. Message: "No models installed. Pull a model from the Library first."
- **Build failure (invalid base model):** Error message inline: "Base model 'xyz' not found. Make sure it's installed."
- **Build failure (name collision):** Warning dialog: "Model 'my-coder' already exists. Overwrite?"
- **Empty state:** When no drafts exist, show a clean empty editor ready to use.

## Pages & Navigation

Sidebar navigation, consistent across all pages:

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| 📦 | Library | `/` | Model Library Browser (landing page) |
| 🏠 | Models | `/models` | Installed Models Dashboard |
| 📝 | Modelfiles | `/modelfiles` | Modelfile Editor |
| ⚙️ | Settings | `/settings` | Ollama endpoint config |

### Settings Page

- **Ollama Server URL** — text input, default `http://localhost:11434`
- **Connection test** button — pings the Ollama server and shows status
- **Theme** — dark mode only for v1 (setting hidden until light mode is added post-v1)

### Header Bar

- App name/logo: "MyOllama"
- Active endpoint display with health indicator (green dot = connected, red = unreachable)
- Current endpoint URL shown as context

## Project Structure

```
myollama/
├── bin/
│   └── cli.js                → CLI entrypoint for npx
├── src/
│   ├── app/
│   │   ├── layout.tsx        → Root layout with sidebar
│   │   ├── page.tsx          → Model Library (landing)
│   │   ├── models/
│   │   │   └── page.tsx      → Installed Models Dashboard
│   │   ├── modelfiles/
│   │   │   └── page.tsx      → Modelfile Editor
│   │   ├── settings/
│   │   │   └── page.tsx      → Settings
│   │   └── api/              → API routes (see above)
│   ├── components/
│   │   ├── ui/               → shadcn/ui components
│   │   ├── sidebar.tsx       → Navigation sidebar
│   │   ├── header.tsx        → Top bar with endpoint status
│   │   ├── model-card.tsx    → Library model card
│   │   ├── pull-progress.tsx → Download progress bar
│   │   ├── model-details.tsx → Expandable model info
│   │   └── modelfile-form.tsx→ Modelfile editor form
│   ├── lib/
│   │   ├── ollama.ts         → Ollama API client (typed)
│   │   ├── config.ts         → Config file read/write (~/.myollama/config.json)
│   │   └── catalog.ts        → Catalog search/filter logic
│   ├── contexts/
│   │   └── pull-context.tsx  → Global pull state provider
│   └── types/
│       └── index.ts          → Shared TypeScript types
├── data/
│   └── catalog.json          → Curated model catalog
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## Config File

All persistent state lives in `~/.myollama/config.json`. No native dependencies required.

```json
{
  "version": 1,
  "ollamaUrl": "http://localhost:11434",
  "modelfiles": [
    {
      "name": "my-coder",
      "from": "qwen3:4b",
      "system": "You are a helpful coding assistant...",
      "parameters": { "temperature": 0.7, "top_p": 0.9 },
      "createdAt": "2026-03-14T00:00:00Z",
      "updatedAt": "2026-03-14T00:00:00Z"
    }
  ]
}
```

## Build & Distribution

### Next.js Standalone Output

`next.config.ts` uses `output: 'standalone'` to produce a self-contained server:

```ts
const nextConfig = {
  output: 'standalone',
};
```

This outputs a minimal Node.js server in `.next/standalone/` that does not require the full `node_modules`.

**Static file serving:** Next.js standalone mode does not serve `.next/static/` or `public/` automatically. The build pipeline must copy these into the standalone directory:
- `.next/static/` → `.next/standalone/.next/static/`
- `public/` → `.next/standalone/public/`

The `bin/cli.js` entrypoint sets the appropriate paths before starting the standalone server.

### npm Package

`package.json` key fields:

```json
{
  "name": "myollama",
  "bin": { "myollama": "./bin/cli.js" },
  "engines": { "node": ">=18.17.0" },
  "files": [
    "bin/",
    ".next/standalone/",
    ".next/static/",
    "public/",
    "data/"
  ],
  "scripts": {
    "build": "next build",
    "prepublishOnly": "npm run build"
  }
}
```

### Build Pipeline

```bash
npm run build        # Produces .next/standalone/ and .next/static/
npm pack             # Creates the distributable tarball
npm publish          # Publishes to npm registry
```

### CLI Entrypoint

`bin/cli.js` handles the `npx myollama` experience:

```
Usage: myollama [options]

Options:
  --port, -p    Port to run on (default: 3000)
  --host        Host to bind to (default: 127.0.0.1)
  --version, -v Show version
  --help        Show help
```

The CLI starts the Next.js standalone server. Default host is `127.0.0.1` (localhost only). Users who want network access explicitly pass `--host 0.0.0.0`.

## Design Principles

1. **Dark theme, polished UI** — LM Studio-level quality using shadcn/ui + Tailwind. Smooth animations, thoughtful spacing, professional feel.
2. **Proxy everything** — Browser never talks to Ollama directly. All requests go through Next.js API routes.
3. **Streaming where possible** — Pull progress and model builds stream progress in real time via SSE.
4. **Offline-first catalog** — The model catalog is bundled, not fetched from the internet. The app works fully offline once installed.
5. **Single command startup** — `npx myollama` and you're running. No Docker, no config files, no prerequisites beyond Node.js.
6. **Zero native dependencies** — No compiled modules. The npm package installs and runs on any platform with Node.js without requiring a C++ toolchain.
