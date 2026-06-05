# CLAUDE.md

This repository is a **Tauri desktop application** for Windows and macOS.

## Commands

```bash
pnpm dev
pnpm tauri:dev
pnpm build
pnpm tauri:build
pnpm lint
pnpm format
```

## Architecture

The app is built as a Tauri desktop client with a React frontend.

### Frontend

- `src/` - React, Tailwind, hooks, components, pages.
- `src/lib/tauri-bridge.ts` exposes the IPC compatibility API used by renderer hooks.

### Native Backend

- `src-tauri/src/` - Tauri command handlers, services, state, and native utilities.
- `src-tauri/tauri.conf.json` - macOS and Windows bundle settings.
- `src-tauri/Cargo.toml` - Rust dependency manifest.

### IPC Bridge

- Tauri `invoke()` is exposed through `tauriApi` and assigned to `window.electronAPI` for compatibility.
- Transcription, permissions, payment, config, and window control are handled through Tauri commands.

## Key Implementation Notes

- Electron has been removed from the repository.
- The build flows are now Tauri-first.
- Native audio loopback is implemented in `src-tauri/src/commands/transcription.rs`.
- macOS screen recording permission is validated natively.
- The GitHub Actions workflow builds Tauri bundles for Windows and macOS.

## Build and Release Workflow

The workflow at `.github/workflows/manual-cross-platform-release.yml`:

- builds on Windows and macOS in parallel
- installs pnpm dependencies
- runs `pnpm tauri:build` (which builds the frontend via `beforeBuildCommand` automatically)
- uploads bundle artifacts
- publishes a GitHub release when the `publish` input is enabled

## Platform Support

- Windows 11+
- macOS 14.4+

## Notes for Developers

- There is no `src/main/` Electron host code in this repo anymore.
- Use the Tauri app as the single desktop implementation.
- Update native dependencies in `src-tauri/Cargo.toml` and frontend dependencies in `package.json`.
- Package manager is pnpm - do not use npm or yarn.
