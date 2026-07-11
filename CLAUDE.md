# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Lookups

Always use Context7 MCP (`mcp__context7__resolve-library-id` then `mcp__context7__query-docs`) before answering any question about a library, framework, SDK, or API. This includes Electron, React, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query, Vite, electron-builder, and electron-updater. Never answer from training data alone.

## Writing Rules

- Never generate em-dashes (--). Use a hyphen (-) or rewrite the sentence instead.
- No filler phrases, no trailing summaries, no explanations of what the code does.
- Comments only when the WHY is non-obvious.

## Commands

```bash
pnpm dev                       # Vite renderer dev server only (http://localhost:15173)
pnpm electron:dev-hide         # Electron + renderer dev, hidden window
pnpm electron:dev-show         # Electron + renderer dev, visible window
pnpm start                     # Alias for electron:dev-hide

pnpm build                     # tsc + vite build (renderer only)
pnpm electron:build-main       # Build Electron main process to electron-dist/
pnpm electron:build            # Full distribution build via electron-builder

pnpm lint                      # ESLint check
pnpm format                    # Prettier + ESLint auto-fix
```

## Architecture

This is an Electron 40 desktop app. `src/main/` is the Node.js main process; `src/renderer/` is the React/Vite renderer. The renderer **never** calls backend APIs - all network calls go through IPC to main.

Path alias: `@/*` resolves to `./src/renderer/*`.

### IPC Bridge

[src/main/preload.cts](src/main/preload.cts) is compiled to CJS (required by Electron) and exposes `window.electronAPI` (aliased as `window.electron`) via `contextBridge`. Renderer types are declared in [src/renderer/types/electron-api.d.ts](src/renderer/types/electron-api.d.ts).

IPC channel naming convention: `domain:action` (e.g., `config:get`, `auth:login`, `live-suggestion:stop`).

Handler registration lives in [src/main/ipc/](src/main/ipc/) - one file per domain. Each `register*Handlers()` is called in `app.whenReady()` inside [src/main/index.ts](src/main/index.ts). Business logic lives in [src/main/services/](src/main/services/) and is exported as singletons (`export const fooService = new FooService()`).

### State: AppState vs ConfigStore

**AppState** ([src/renderer/hooks/use-app-state.tsx](src/renderer/hooks/use-app-state.tsx)) is read-only in the renderer. An `AppStateManager` singleton (pinned to `globalThis` to survive HMR) subscribes to `app-state-updated` push events from main; it falls back to 1-second polling when that API is unavailable. Never mutate AppState from the renderer - call the appropriate IPC method on main instead.

**ConfigStore** ([src/renderer/hooks/use-config-store.ts](src/renderer/hooks/use-config-store.ts)) is a Zustand store backed by the main-process Electron Store ([src/main/store/config.store.ts](src/main/store/config.store.ts)). Mutations call `window.electronAPI.config.update(...)` via IPC. A runtime migration IIFE at the bottom of the main store backfills newly-added keys on first launch.

### Transcription and Suggestion Flow

[src/main/services/transcript.service.ts](src/main/services/transcript.service.ts) is the central orchestrator. `transcriptService.ingest(channel, type, text)` merges both audio channels, deduplicates overlapping segments, and triggers `liveSuggestionService.startGenerateSuggestion()` when a final `Other` transcript arrives - with a `LIVE_SUGGESTION_GAP_MS` guard that suppresses the call if Self spoke recently.

- `ch_0` = `Speaker.Other` (interviewer, captured via loopback audio)
- `ch_1` = `Speaker.Self` (candidate, captured via microphone)

Action suggestions are independent of transcripts - triggered by screenshot captures (up to `ACTION_SUGGESTION_MAX_CAPTURES` = 4 images per request).

### Routing

Hash-based router (required for Electron `file://` protocol). Routes: `/` (index, redirects based on login state) -> `/auth/login` or `/auth/signup` -> `/main` (interview UI) -> `/payment`.

### Window and Stealth Mode

The main window reference is passed to `windowControlService` and `zoomService` after creation. Window bounds persist to Electron Store on `close` and are restored on next launch with minimum-size clamping (`MIN_WIDTH` / `MIN_HEIGHT` from [src/main/consts.ts](src/main/consts.ts)).

Stealth mode hides the window from screen capture via `setContentProtection`. The main process emits `stealth-changed`; the preload script toggles a `stealth` CSS class on `document.body`. Content protection is on by default; pass `--disable-content-protection` at launch to disable it (dev/testing only).

Background throttling is disabled globally (via `app.commandLine` switches and `backgroundThrottling: false` in `webPreferences`) so audio keeps running when the window is occluded.

### Backend and Constants

Backend URL: `localhost:8080` in dev, `api.powerinterviewai.com` in prod - switched by `EnvUtil.isDev()` in [src/main/consts.ts](src/main/consts.ts). All feature constants (zoom steps, suggestion gaps, transcript merge window) live in the same file.

[src/main/api/client.ts](src/main/api/client.ts) reads `sessionToken` from the config store before every request and sets it as the Bearer token. Streaming responses return a raw `ReadableStream<Uint8Array>`.

## Project Spec

See [SPEC.md](SPEC.md) for full feature details, tech stack table, and platform support.
