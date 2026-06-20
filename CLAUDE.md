# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Writing Rules

- Never generate em-dashes (--). Use a hyphen (-) or rewrite the sentence instead.
- No filler phrases, no trailing summaries, no explanations of what the code does.
- Comments only when the WHY is non-obvious.

## Commands

```bash
# Development
pnpm dev                       # Vite renderer dev server only
pnpm electron:dev-hide         # Electron + renderer dev (hidden window)
pnpm electron:dev-show         # Electron + renderer dev (visible window)
pnpm start                     # Alias for electron:dev-hide

# Build
pnpm build                     # tsc + vite build (renderer)
pnpm electron:build-main       # Build Electron main process
pnpm electron:build            # Full Electron distribution build

# Code quality
pnpm lint                      # ESLint check
pnpm format                    # Prettier + ESLint auto-fix
```

## IPC Pattern

All backend communication from the renderer goes through IPC to the main process. The renderer never calls backend APIs directly.

- Preload bridge: [src/main/preload.cts](src/main/preload.cts) exposes `window.electronAPI`
- IPC handlers: [src/main/ipc/](src/main/ipc/) (one file per domain)
- Services: [src/main/services/](src/main/services/) (business logic called by handlers)

## Path Aliases

`@/*` resolves to `./src/renderer/*`.

## State Pattern

- `AppState` ([src/renderer/hooks/use-app-state.tsx](src/renderer/hooks/use-app-state.tsx)) - read-only in renderer, pushed from main via IPC
- `ConfigStore` ([src/renderer/hooks/use-config-store.ts](src/renderer/hooks/use-config-store.ts)) - Zustand + Electron Store, persisted to disk

## Routing

Hash-based router (required for Electron file:// protocol). Route map: `/` -> auth -> `/main` -> `/payment`.

## Project Spec

See [SPEC.md](SPEC.md) for full architecture, features, and tech stack details.
