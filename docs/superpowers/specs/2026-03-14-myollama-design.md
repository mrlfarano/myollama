# MyOllama — Design Specification

## Overview

MyOllama is a web-based Ollama model management tool — think LM Studio but locally hosted and browser-based. It provides a polished UI for browsing, downloading, managing, and configuring Ollama models.

**Distribution:** Published to npm, run via `npx myollama` (optionally `npx myollama --port 8080`).

**Target audience:** The broader Ollama community — anyone who wants a visual interface for managing their Ollama instance.

## v1 Scope

Three features focused on model management:

1. **Model Library Browser** — Search, discover, and download models
2. **Installed Models Dashboard** — View, inspect, and delete installed models
3. **Modelfile Editor** — Create custom model variants visually

Future features (post-v1): Chat playground, parameter tuning, side-by-side model comparison, prompt templates, resource monitoring, request logs, multi-endpoint switching, API explorer, embedding tools, vision support, batch inference.

## Tech Stack

- **Framework:** Next.js 15 (App Router), TypeScript
- **UI:** Tailwind CSS + shadcn/ui, dark theme, LM Studio-level polish
- **Database:** SQLite (via better-sqlite3 or Drizzle) for settings, Modelfile drafts, pull history
- **Distribution:** npm package with `bin` entry for CLI startup
- **Architecture:** Monolithic — single Next.js app, API routes proxy all Ollama requests

## Architecture

```
Browser  →  Next.js Server  →  Ollama Server
                │
             SQLite DB
```

All Ollama API calls proxy through Next.js API routes. The browser never talks to Ollama directly. This solves CORS, enables request logging, and provides a clean error handling layer.

### Configurable Endpoint

The Ollama server URL is a user setting, not hardcoded:
- Default: `http://localhost:11434`
- Changeable via Settings page
- Persisted in SQLite
- Health check indicator in the header showing connection status

### Ollama API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tags` | GET | List installed models |
| `/api/show` | POST | Get model details (template, params, license) |
| `/api/pull` | POST | Download a model (streaming progress) |
| `/api/delete` | DELETE | Remove a model |
| `/api/create` | POST | Create model from Modelfile (streaming) |

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
      "sizes": ["1b", "3b", "8b", "70b"],
      "url": "https://ollama.com/library/llama3.3"
    }
  ]
}
```

The catalog is static and ships with the app. It can be updated by updating the npm package.

### Tag Selection

When a user clicks "Pull Model," a dropdown/modal shows available tags for that model family (e.g., `:4b`, `:8b`, `:70b`, `:latest`). Tag information comes from the curated catalog. For manual pulls via the bottom bar, the user types the full `model:tag` string.

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

## Feature 2: Installed Models Dashboard

### Purpose

View all locally installed models with details, and manage them (inspect, delete).

### UI Layout

- **Header** showing model count and total storage used
- **Model list** — table or card list, each row showing:
  - Model name and tag (e.g., `qwen3:4b`)
  - File size
  - Model family / category
  - Last modified date
  - Expand button for details
  - Delete button (with confirmation dialog)
- **Sort controls** — sort by name, size, or last modified
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
  - Read-only Modelfile text that updates as the user changes form values
  - Shows the exact content that will be sent to `POST /api/create`

### Build Flow

1. User fills out the form
2. Right panel shows live Modelfile preview
3. User clicks "Build" → `POST /api/create` with the Modelfile content
4. Build progress streams inline (similar to pull progress)
5. On success, the new model appears in the Installed Models dashboard

### Persistence

- Modelfile drafts are saved to SQLite with a name, content, and last-edited timestamp
- User can load, edit, and re-build saved Modelfiles
- Loading an installed model's details pre-populates the editor (extract from `POST /api/show`)

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
- **Theme** — dark mode only for v1 (can add light mode later)

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
│   │   ├── db.ts             → SQLite setup + queries
│   │   └── catalog.ts        → Catalog search/filter logic
│   └── types/
│       └── index.ts          → Shared TypeScript types
├── data/
│   └── catalog.json          → Curated model catalog
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

## Database Schema (SQLite)

```sql
-- App settings (key-value)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Saved Modelfile drafts
CREATE TABLE modelfiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  base_model TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pull history (for tracking what was downloaded when)
CREATE TABLE pull_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model TEXT NOT NULL,
  tag TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);
```

## CLI Entrypoint

`bin/cli.js` handles the `npx myollama` experience:

```
Usage: myollama [options]

Options:
  --port, -p    Port to run on (default: 3000)
  --host, -h    Host to bind to (default: 0.0.0.0)
  --version, -v Show version
  --help        Show help
```

The CLI starts the Next.js production server. The package.json `bin` field points to this file.

## Design Principles

1. **Dark theme, polished UI** — LM Studio-level quality using shadcn/ui + Tailwind. Smooth animations, thoughtful spacing, professional feel.
2. **Proxy everything** — Browser never talks to Ollama directly. All requests go through Next.js API routes.
3. **Streaming where possible** — Pull progress and Modelfile builds stream progress in real time via SSE.
4. **Offline-first catalog** — The model catalog is bundled, not fetched from the internet. The app works fully offline once installed.
5. **Single command startup** — `npx myollama` and you're running. No Docker, no config files, no prerequisites beyond Node.js.
