# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev                    # Vite renderer dev server only
npm run electron:dev-hide      # Electron + renderer dev (hidden window)
npm run electron:dev-show      # Electron + renderer dev (visible window)
npm start                      # Alias for electron:dev-hide

# Build
npm run build                  # tsc + vite build (renderer)
npm run electron:build-main    # Build Electron main process
npm run electron:build         # Full Electron distribution build

# Code quality
npm run lint                   # ESLint check
npm run format                 # Prettier + ESLint auto-fix
```

## Architecture

This is an **Electron desktop application** — an AI-powered live interview assistant that provides real-time transcription and AI suggestions during job interviews.

**Stack:** React 19 + TypeScript + Tailwind CSS + shadcn/ui (renderer), Electron 40 (main), Vite (build).

### Process Split

```
src/main/        ← Electron main process (Node.js)
src/renderer/    ← React/Vite frontend
```

The path alias `@/*` resolves to `./renderer/*`.

**Main process** handles: audio capture, WebSocket connections to backend, IPC with renderer, Electron Store persistence, global hotkeys, auto-updates.

**Renderer** handles: UI, routing, state display. It never calls backend APIs directly — all backend communication goes through IPC to main.

### IPC Bridge

[src/main/preload.cts](src/main/preload.cts) exposes `window.electronAPI` to the renderer with namespaced APIs: `config`, `auth`, `payment`, `llm`, `appState`, `transcription`, `liveSuggestion`, `actionSuggestion`, `tools`, `window`, `autoUpdater`, `external`.

IPC handlers live in [src/main/ipc/](src/main/ipc/) (one file per domain). Services in [src/main/services/](src/main/services/) contain the business logic called by handlers.

### State Management (Renderer)

Two distinct stores:

1. **AppState** ([src/renderer/hooks/use-app-state.tsx](src/renderer/hooks/use-app-state.tsx)) — React Context, synced from main via IPC. Holds real-time interview state: running status, transcripts, AI suggestions, credits, backend health. Read-only in renderer; mutated by main process pushing updates.

2. **ConfigStore** ([src/renderer/hooks/use-config-store.ts](src/renderer/hooks/use-config-store.ts)) — Zustand store backed by Electron Store. Holds user settings, auth tokens, audio/video device selection, interview configuration (CV, job description). Persisted to disk.

### API Layer (Main Process)

[src/main/api/client.ts](src/main/api/client.ts) — `ApiClient` class: fetch-based, Bearer token auth, streaming support. Wrapped by domain-specific clients: `AuthApi`, `LLMApi`, `PaymentApi`, `HealthCheckApi` in [src/main/api/](src/main/api/).

Backend URL is defined in [src/main/consts.ts](src/main/consts.ts).

### Routing (Renderer)

Hash-based router (required for Electron): `/` → auth flow → `/main` (interview UI) → `/payment`.

Router defined in [src/renderer/router.tsx](src/renderer/router.tsx).

### Key Features

- **Transcription:** Dual-channel (speaker + interviewer mic) via WebSocket streaming — [src/main/services/transcript-service.ts](src/main/services/transcript-service.ts)
- **Live Suggestions:** Real-time AI responses based on CV + job description — [src/main/services/live-suggestion-service.ts](src/main/services/live-suggestion-service.ts)
- **Action Suggestions:** Screenshot-based problem solving (up to 3 images) — [src/main/services/action-suggestion-service.ts](src/main/services/action-suggestion-service.ts)
- **Credits:** Purchase and usage tracking via payment API
- **Auto-Updates:** electron-updater publishing to GitHub releases
