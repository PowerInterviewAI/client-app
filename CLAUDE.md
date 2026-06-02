# CLAUDE.md

This repository is a **Tauri desktop application** for Windows and macOS.

## Commands

```bash
npm run dev
npm run tauri:dev
npm run build
npm run tauri:build
npm run lint
npm run format
```

## Architecture

The app is built as a Tauri desktop client with a React frontend.

### Renderer
- `src/renderer/` — React, Tailwind, hooks, components, pages.
- `src/renderer/lib/tauri-bridge.ts` exposes the same compatibility API used by existing renderer hooks.

### Native Backend
- `src-tauri/src/` — Tauri command handlers, services, state, and native utilities.
- `src-tauri/tauri.conf.json` — macOS and Windows bundle settings.
- `src-tauri/Cargo.toml` — Rust dependency manifest.

### IPC Bridge
- Tauri `invoke()` is exposed through `tauriApi` and assigned to `window.electronAPI` for compatibility.
- Transcription, permissions, payment, config, and window control are handled through Tauri commands.

## Key Implementation Changes

- Electron has been removed from the repository.
- The build flows are now Tauri-first.
- Native audio loopback is implemented in `src-tauri/src/commands/transcription.rs`.
- MacOS screen recording permission is validated natively.
- The GitHub Action workflow now builds Tauri bundles instead of Electron packages.

## Build and Release Workflow

The workflow at `.github/workflows/manual-cross-platform-release.yml`:
- checks out the repo
- installs npm dependencies
- builds renderer assets
- runs `npm run tauri:build`
- uploads generated bundle artifacts
- publishes releases when enabled

## Platform Support

- Windows 11+
- macOS 14.4+

## Notes for Developers

- There is no `src/main/` Electron host code in this repo anymore.
- Use the Tauri app as the single desktop implementation.
- Update native dependencies in `src-tauri/Cargo.toml` and frontend dependencies in `package.json`.
