# Contributing to MyOllama

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/myollama.git`
3. **Install dependencies**: `npm install`
4. **Start dev server**: `npm run dev`
5. **Create a branch**: `git checkout -b feat/your-feature`

## Development

### Prerequisites

- [Node.js](https://nodejs.org) >= 18.17
- [Ollama](https://ollama.com) running locally (for E2E tests)

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run test:all` | All tests |

### Project Structure

- `src/app/` — Next.js pages and API routes
- `src/components/` — React components
- `src/lib/` — Shared libraries (Ollama client, config, catalog)
- `src/types/` — TypeScript type definitions
- `data/` — Curated model catalog
- `tests/` — Unit and E2E tests

## Pull Request Process

1. **Branch from `main`** — use descriptive branch names like `feat/chat-playground` or `fix/pull-progress-bar`
2. **Write tests** — new features need tests, bug fixes need regression tests
3. **Run the full suite** — `npm run test:all` should pass
4. **Keep PRs focused** — one feature or fix per PR
5. **Write clear commit messages** — we use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

### PR Checklist

- [ ] Tests pass (`npm run test:all`)
- [ ] Lint passes (`npm run lint`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] PR description explains the change and motivation

## Code Style

- **TypeScript** — strict mode, no `any` unless absolutely necessary
- **Components** — one component per file, `"use client"` directive for client components
- **Naming** — kebab-case for files, PascalCase for components, camelCase for functions/variables
- **Imports** — use `@/` path alias for project imports

## Adding Models to the Catalog

The curated catalog is at `data/catalog.json`. To add a model:

1. Add an entry following the existing schema
2. Include: `name`, `description`, `categories`, `tags`, `default_tag`, `size_category`, `url`
3. Verify the model exists on [ollama.com/library](https://ollama.com/library)
4. Keep descriptions concise (1-2 sentences)

## Reporting Issues

- **Bugs** — use the Bug Report issue template
- **Features** — use the Feature Request issue template
- **Security** — see [SECURITY.md](SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
