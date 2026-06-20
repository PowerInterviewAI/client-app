# SPEC.md

Project specification for Power Interview AI - a privacy-first AI-powered interview assistant.

## Overview

Power Interview is an Electron desktop application that provides real-time transcription and AI suggestions during live job interviews. It runs entirely on the user's machine; no interview audio or transcripts are stored on external servers.

## Tech Stack

| Layer           | Technology                                  |
| --------------- | ------------------------------------------- |
| Desktop shell   | Electron 40                                 |
| Renderer        | React 19, TypeScript, Vite                  |
| Styling         | Tailwind CSS v4, shadcn/ui                  |
| State           | Zustand (config), React Context (app state) |
| Data fetching   | TanStack Query v5                           |
| Persistence     | Electron Store                              |
| Build/dist      | electron-builder, GitHub Releases           |
| Package manager | pnpm                                        |

## Process Architecture

```
src/
  main/          Electron main process (Node.js)
    api/         HTTP clients (AuthApi, LLMApi, PaymentApi, HealthCheckApi)
    ipc/         IPC handler files, one per domain
    services/    Business logic called by IPC handlers
    preload.cts  Exposes window.electronAPI to renderer
    consts.ts    Backend URL and other constants
  renderer/      React/Vite frontend
    hooks/       use-app-state.tsx (AppState), use-config-store.ts (ConfigStore)
    router.tsx   Hash-based router
```

## IPC Namespaces

`window.electronAPI` exposes: `config`, `auth`, `payment`, `llm`, `appState`, `transcription`, `liveSuggestion`, `actionSuggestion`, `tools`, `window`, `autoUpdater`, `external`.

## Key Features

### Dual-Channel Transcription

Real-time ASR via WebSocket streaming on two separate channels - speaker (system audio loopback) and interviewer (microphone). Service: [src/main/services/transcript-service.ts](src/main/services/transcript-service.ts).

### Live Suggestions

Streaming AI responses generated from the user's CV and job description, triggered by live transcript context. Service: [src/main/services/live-suggestion-service.ts](src/main/services/live-suggestion-service.ts).

### Action Suggestions

Screenshot-based problem solving. Accepts up to 3 images, sends them to the LLM backend, returns syntax-highlighted code output. Service: [src/main/services/action-suggestion-service.ts](src/main/services/action-suggestion-service.ts).

### Credits and Payments

Purchase and usage tracking via the payment API. Route: `/payment`.

### Auto-Updates

electron-updater publishes to GitHub Releases under `PowerInterviewAI/client` (configured in `package.json` build.publish).

## Backend Communication

- REST (HTTP): auth, payment, LLM suggestions
- WebSocket: real-time transcription streaming
- API client: [src/main/api/client.ts](src/main/api/client.ts) - fetch-based, Bearer token auth, streaming support

## Privacy Model

- CV, job description, and config stay on the user's device (Electron Store)
- Only the minimum data needed for AI suggestions is sent to the backend
- No transcript storage on external servers
- Credentials encrypted via Electron Store

## Platform Support

- Windows 10/11 x64 (NSIS installer)
- macOS Apple Silicon and Intel (DMG + ZIP)

## Project Structure

```
power-interview-client/
  src/
    main/
    renderer/
  public/
  build/          Build resources (icons, entitlements)
  release/        electron-builder output (gitignored)
  electron-dist/  Compiled main process (gitignored)
  dist/           Compiled renderer (gitignored)
  .claude/
    skills/       Project-level Claude Code skills
  pnpm-workspace.yaml
  .npmrc
```
