<div align="center">

# 🦙 MyOllama

**Web-based Ollama model management. Think LM Studio, but in your browser.**

[![CI](https://github.com/mrlfarano/myollama/actions/workflows/ci.yml/badge.svg)](https://github.com/mrlfarano/myollama/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.17-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mrlfarano/myollama/pulls)

<br />

Browse, download, and manage your Ollama models through a polished dark-themed UI.
No more CLI juggling — just open your browser.

<br />

[Quick Start](#-quick-start) · [Features](#-features) · [Screenshots](#-screenshots) · [Docker](#-docker) · [Development](#-development) · [Contributing](#-contributing)

</div>

---

## 🚀 Quick Start

Make sure [Ollama](https://ollama.com) is running, then:

```bash
npx myollama
```

Open **http://localhost:3000** and you're in.

### Options

```bash
npx myollama --port 8080        # Custom port
npx myollama --host 0.0.0.0     # Expose to network
```

## ✨ Features

### 📦 Model Library

Browse a curated catalog of 50+ popular models. Search by name, filter by category and size, and pull with one click.

- **Search & Filter** — Find models by name, category (Chat, Code, Vision, Embedding), or size (Small, Medium, Large)
- **Tag Selection** — Pick specific variants and quantizations before downloading
- **Live Pull Progress** — Real-time streaming progress bars with speed and ETA
- **Pull by Name** — Download any model by typing its full `model:tag` string

### 🖥️ Installed Models Dashboard

See everything you have at a glance.

- **Model Details** — Expand any model to see its template, parameters, system prompt, quantization, and license
- **Storage Tracking** — Total disk usage across all models
- **One-Click Delete** — Remove models with a confirmation dialog
- **Refresh** — Re-sync with your Ollama instance instantly

### 📝 Modelfile Editor

Create custom model variants visually — no Modelfile syntax required.

- **Form-Based Editing** — Set base model, system prompt, and parameters with sliders and inputs
- **Live JSON Preview** — See the exact API request as you build it
- **Draft Persistence** — Save and load drafts across sessions
- **Streaming Build** — Watch your model get created in real time

### ⚙️ Settings

- **Configurable Endpoint** — Point to any Ollama instance (local, remote, Jetson, cloud)
- **Connection Testing** — Server-side health check with visual status indicator
- **Persistent Config** — Settings saved to `~/.myollama/config.json`

## 📸 Screenshots

> *Coming soon — the app features a polished dark theme with purple accents, responsive card grids, and smooth animations.*

## 🏗️ Architecture

```
Browser  →  Next.js API Routes  →  Ollama Server
                   │
             ~/.myollama/
               config.json
```

- **Proxy Pattern** — All Ollama requests go through Next.js API routes. The browser never talks to Ollama directly, avoiding CORS issues and enabling logging.
- **Streaming** — Model pulls and builds stream progress via NDJSON.
- **Zero Native Deps** — No compiled modules. Runs anywhere Node.js runs.
- **Offline Catalog** — Model catalog is bundled, no internet required after install.

## 🐳 Docker

```bash
# Build
docker build -t myollama .

# Run (connect to Ollama on the host)
docker run -p 3000:3000 myollama
```

To connect to Ollama running on your host machine, configure the endpoint in Settings to use your host IP or `host.docker.internal:11434`.

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org) >= 18.17
- [Ollama](https://ollama.com) running locally (for E2E tests)

### Setup

```bash
git clone https://github.com/mrlfarano/myollama.git
cd myollama
npm install
npm run dev
```

Open http://localhost:3000.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (standalone) |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run test:all` | Run all tests |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) v4 + [Base UI](https://base-ui.com) |
| Icons | [Lucide](https://lucide.dev) |
| Unit Tests | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) |
| E2E Tests | [Playwright](https://playwright.dev) |
| CI/CD | [GitHub Actions](https://github.com/features/actions) (containerized) |

### Project Structure

```
myollama/
├── bin/cli.js              # CLI entrypoint (npx myollama)
├── data/catalog.json       # Curated model catalog (50+ models)
├── scripts/postinstall.js  # Platform-specific binding installer
├── src/
│   ├── app/                # Next.js pages and API routes
│   │   ├── api/            # Ollama proxy, catalog, settings, modelfiles
│   │   ├── models/         # Installed Models page
│   │   ├── modelfiles/     # Modelfile Editor page
│   │   ├── settings/       # Settings page
│   │   └── page.tsx        # Model Library (home)
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── *.tsx           # App components
│   ├── contexts/           # React contexts (connection, pull state)
│   ├── lib/                # Shared libraries (ollama client, config, catalog)
│   └── types/              # TypeScript type definitions
├── tests/
│   ├── unit/               # Vitest unit tests
│   └── e2e/                # Playwright E2E tests
├── Dockerfile              # Production container
└── docs/                   # Design spec and implementation plan
```

## 🗺️ Roadmap

**v1 (current)** — Model management foundation
- [x] Model Library Browser with search & filters
- [x] Installed Models Dashboard
- [x] Modelfile Editor with live preview
- [x] Configurable Ollama endpoint
- [x] CLI distribution via npx

**v2 (planned)** — Inference & monitoring
- [ ] Chat Playground with streaming responses
- [ ] Side-by-side model comparison
- [ ] Parameter tuning panel (temperature, top_p, etc.)
- [ ] Prompt templates library
- [ ] Resource monitor (GPU/CPU/RAM usage)
- [ ] Request logging & history

**v3 (future)**
- [ ] Vision / multimodal support
- [ ] Embedding tools & similarity search
- [ ] Batch inference
- [ ] API explorer with code generation
- [ ] Multi-endpoint switching

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:all`)
5. Open a PR

## 📄 License

MIT

---

<div align="center">

Built with ❤️ for the Ollama community

[Report Bug](https://github.com/mrlfarano/myollama/issues) · [Request Feature](https://github.com/mrlfarano/myollama/issues)

</div>
