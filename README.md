# Power Interview AI — Tauri Desktop Interview Assistant

## Overview

Power Interview AI is a native desktop interview assistant built with **Tauri**, **React**, and **TypeScript**.
It delivers live transcription, intelligent interview suggestions, and secure local configuration on:

- **Windows 11+**
- **macOS 14.4+**

This repository contains the frontend UI in `src/renderer/` and the Tauri backend in `src-tauri/`.

## Key Features

- Real-time transcription of interviewer and candidate audio
- Dual-channel audio capture (microphone + system audio)
- Native screen recording permissions for macOS
- Fast Tauri desktop packaging for Windows and macOS
- Lightweight local state and secure storage
- Automatic release packaging via GitHub Actions

## Platform Notes

### Windows

- Uses system audio capture via Tauri and browser media APIs
- Requires Windows 11 or later for reliable audio capture
- Uses the default output device and WASAPI-compatible loopback when available

### macOS

- Requires macOS 14.4 or later
- Uses screen recording permission to capture system audio alongside microphone input
- If system audio capture is unavailable, users should install a virtual audio device such as BlackHole or Loopback

## Getting Started

### Prerequisites

- Node.js 22.x
- npm
- Rust toolchain (for Tauri builds)

### Install

```bash
git clone https://github.com/PowerInterviewAI/client-app.git
cd power-interview-client
npm install
```

### Development

- `npm run dev` — start the renderer only
- `npm run tauri:dev` — launch the Tauri desktop app locally

### Build

```bash
npm run build
npm run tauri:build
```

### Package Output

Tauri bundles are produced under `src-tauri/target/release/bundle/`.

## Project Structure

```
power-interview-client/
├── src/               # React renderer app
├── public/            # Static assets
├── src-tauri/         # Rust Tauri backend and native commands
├── package.json       # npm scripts and dependencies
├── README.md          # Developer documentation
└── .github/           # CI / release workflow
```

## Tauri Architecture

- `src/renderer/` contains the React UI and Tauri bridge code.
- `src-tauri/src/` contains native command handlers and services.
- `src-tauri/tauri.conf.json` defines the macOS and Windows bundle settings.
- `src-tauri/Cargo.toml` manages Rust dependencies.

## Loopback Audio Capture

System audio capture is implemented as a Tauri-friendly, platform-aware helper:

- **Windows:** Attempts native WASAPI loopback capture
- **macOS:** Validates screen recording permission and uses browser display capture

This is the most stable cross-platform approach for modern Tauri desktop clients.

## Build & Release

A GitHub Actions workflow is configured at `.github/workflows/manual-cross-platform-release.yml`.
It installs dependencies, builds the renderer, and runs `npm run tauri:build` for both Windows and macOS.

## Notes

- Electron support has been removed from this repository.
- Legacy Electron files, scripts, and build paths are no longer part of the project.
- Use Tauri for all local desktop builds.

## License

MIT
