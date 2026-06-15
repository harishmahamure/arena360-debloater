# Windows 11 Debloater

A Tauri 2 desktop app for Windows 11 that removes bloatware, disables telemetry, manages services, cleans disk space, and applies safe preset profiles — with restore points and one-click revert.

## Tech Stack

- **UI:** React 19 + TypeScript + Tailwind CSS 4 + Zustand
- **Backend:** Rust (Tauri 2) + PowerShell scripts
- **Catalog:** YAML-defined tweaks with detect / apply / revert scripts

## Features

- Scan dashboard with debloat score
- App removal (Store + provisioned packages)
- Privacy & telemetry controls
- Tiered service manager
- Disk cleanup with size estimates
- Preset profiles (Light, Privacy, Gaming)
- Windows Update control panel (pause, defer, bandwidth)
- Tasks & Startup manager
- **Background Usage scanner** — live CPU/RAM/GPU sampling, stop forever or uninstall
- Restore point before apply + session revert

## Development

```bash
npm install
npm run tauri dev
```

> **Note:** Full system operations require **Windows 11** with administrator rights. On macOS/Linux you can develop the UI; scan/apply return mock data.

## Build (Windows)

```bash
npm run tauri build
```

Output: `src-tauri/target/release/bundle/nsis/debloater_x64-setup.exe`

## Safety

- Restore point created before every apply (default on)
- Change log stored in `%APPDATA%/debloater/sessions/`
- Advanced tweaks require explicit confirmation
- One-click revert replays revert scripts in reverse order

## Project Structure

- `src/` — React frontend
- `src-tauri/src/engine/` — Rust debloat engine
- `src-tauri/resources/tweaks/` — YAML tweak catalog
- `src-tauri/resources/scripts/` — PowerShell detect/apply/revert scripts
- `src-tauri/resources/presets/` — Preset profile definitions
