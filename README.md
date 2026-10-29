# Spider Game Engine (Open Source) 🕷️🎮

🌐 **Live Web Showcase**: [https://m4spider.github.io/spider-game-engine-open-source-/](https://m4spider.github.io/spider-game-engine-open-source-/)  
**Fingerprint**: `[M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]`  
**Author**: M4SPIDER (`support@m4spider.com`)  
**Repository**: [https://github.com/M4SPIDER/spider-game-engine-open-source-](https://github.com/M4SPIDER/spider-game-engine-open-source-)  
**License**: MIT  

---

## Overview

**Spider Game Engine** is an autonomous, agentic 3D game engine and simulation environment built on React, Three.js (@react-three/fiber), and WebGL with native multi-platform support (Electron, Tauri, and Web).

It integrates directly with multimodal AI models (including Meta Llama and Muse AI) over MCP (Model Context Protocol) to synthesize, mount, verify, and run 3D games and interactive simulations entirely in real-time.

---

## Features

- **Real-Time Dynamic JSX Engine**: Live mounting of arbitrary React Three Fiber components with instant AST compilation cache.
- **Autonomous Agentic Loop**: Built-in MCP server (`http://localhost:9287/mcp`) supporting live inspection, screenshot capture, 3D viewport verification, and autonomous game generation.
- **Full CLI Command Execution (Desktop)**: The AI agent can run native shell commands (`powershell.exe` on Windows, `/bin/bash` on Linux/Unix) with live streaming output.
- **System-Wide File Creation**: Create, edit, and organize files anywhere on the computer with automatic recursive directory scaffolding.
- **Dual Permission Governance**: Toggle between **Ask Permission (Secure Mode)** for interactive review and **Auto Mode (No Permission)** for 100% autonomous agent execution.
- **Universal Browser Support**: Runs in **ANY modern browser** (Chrome, Firefox, Safari, Edge, Arc, Brave) and on **mobile phones & tablets** (iOS & Android) with zero setup required.
- **Live Concurrent Chat (Chat While Streaming)**: Chat with the agent anytime *while it is working without stopping streaming* — steer, add ideas, and guide the agent mid-flight.
- **Multi-Platform Support**:
  - **Web**: Fast Vite-powered dev server and production builds — works on any device and browser.
  - **Desktop (Windows Electron)**: Desktop shell with deep OS integrations.
  - **Desktop (Windows Tauri)**: Ultra-lightweight Rust-backed native executable.
- **Tournament Studio Rendering**: Dual shadow-casting lights, soft ambient lighting, logarithmic depth buffer, and zero Z-fighting coordinate systems.
- **Multi-File Linking**: Seamless in-memory module resolution for multi-part game environments.

---

## ⚡ Full Agent Capabilities & System Access

Spider Game Engine grants AI agents complete developer execution capabilities with configurable governance:

### 1. 🖥️ Real CLI Command Execution (`runCommand`)
- **Native Shell Power**: In desktop mode (Electron / Tauri), the AI agent can execute arbitrary shell commands directly on the host computer (`powershell.exe` on Windows, `/bin/bash` / `zsh` on Linux/Unix).
- **Live Output Streaming**: Captures real-time `stdout` and `stderr` streams directly into the engine's debug console and agent reasoning context.
- **Workflow Automation**: Build projects, run package managers (`npm install`, `cargo build`), trigger git operations, compile standalone executables, and run diagnostic scripts automatically.

> 🌐 **Browser Mode & Execution Limits**:
> In pure web browser mode (due to browser sandbox security policies), direct host OS CLI commands cannot be executed. **However, the AI agent still works within browser limits and creates the exact same 3D games and simulations!** It uses in-memory virtual module compilation, live React Three Fiber AST evaluation, and `IndexedDB`/`localStorage` persistence to deliver the identical 3D gaming experience.

### 2. 📂 Deep File System Access (Create Files Anywhere on Computer)
- **System-Wide File Creation**: Create, read, edit, and organize files in any directory or path across the computer with automatic recursive directory creation (`fs.mkdirSync`).
- **Asset & Project Pipelines**: The agent can scaffold complete multi-folder game structures (`src/`, `assets/`, `audio/`, `models/`), write React Three Fiber components, convert textures, and link modular imports on the fly.
- **File Watching & Live Hot-Reloading**: Real-time folder watching instantly updates the in-memory 3D runtime whenever files change on disk.

### 3. 🛡️ Dual Permission & Security Modes

You have 100% control over how the AI agent interacts with your system:

| Mode | Behavior | Best Used For |
| :--- | :--- | :--- |
| **🛡️ Ask Permission (Secure Mode)** | **Interactive Approval Gate**: The agent pauses and displays an approval card before running CLI commands, creating files, or making critical scene edits. You can review the exact command or file path and click **Allow** or **Deny**. | Safe development, critical project environments, and step-by-step code review. |
| **⚡ Auto Mode (No Permission / Autonomous)** | **Zero-Friction Autonomy**: The agent executes CLI commands, creates files anywhere, and mounts 3D scenes automatically without pausing for permission. | High-speed prototyping, autonomous overnight game development, and unattended CI/agent loops. |

> 💡 **Toggle Anytime**: Switch between **Secure Mode** and **Auto Mode** with a single click in the top AI status bar or under **Settings > Agent Security & File Permissions**.

### 4. 💬 Live Concurrent Chat (Chat While Streaming Without Stopping)
- **Continuous Conversation**: You can chat with the AI agent *while* it is actively working, compiling, and running commands without stopping or interrupting the live stream.
- **Mid-Flight Steering**: Send follow-up ideas, tweaks, and corrections mid-flight; the agent receives and integrates your live instructions without missing a beat.

---

## Quick Start

### 1. Web Dev Server (Runs in Any Browser)
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in Chrome, Edge, Safari, Firefox, or on your mobile phone.

### 2. Electron Desktop App
```bash
npm run electron:dev
# or for pre-built:
npm run electron:built
```

### 3. Tauri Desktop App
```bash
npm run tauri:dev
```

### 4. Universal Web & Mobile Access (Any Browser)
> 🌐 **Works in ANY Browser**: Open the live link on desktop, tablet, or phone (iOS Safari & Android Chrome). Full 3D WebGL rendering, touch controls, and AI game synthesis are supported universally with zero installation!

---

## MCP Server & Autonomous Agent Integration

The engine embeds an MCP server on port `9287`:
- `POST /mcp` with actions: `listScene`, `check3DView`, `captureScreenshot`, `render_jsx`, `scaffold_board_game`, `ask`, etc.
- Seamlessly connects AI coding agents directly to the 3D canvas for multimodal closed-loop verification.

---

## 🚀 Coming Soon (Engine Roadmap)

Active development is underway on the next evolutionary leap for Spider Game Engine:

- 🔊 **Audio Support for Games**:
  - Full WebAudio and spatial 3D audio runtime.
  - Positional 3D sound effects (SFX), background music (BGM) tracks, collision impact sounds, and audio triggers.
- 📱 **More Mature Mobile UI (Touch V2)**:
  - Dual floating virtual joysticks (left for locomotion, right for camera orbit).
  - Fluid multi-touch gesture navigation (pinch-to-zoom, two-finger pan, twist-orbit).
  - Native haptic vibration feedback and adaptive landscape/portrait game HUDs.
- ⚔️ **Complex Combat Systems**:
  - Melee weapon collision, ranged projectile physics, and precision 3D hitboxes.
  - Dynamic health, stamina, and combo chain counters.
  - Autonomous enemy combat AI behaviors and aggression states.
- 🕺 **Advanced Animation Support**:
  - Full skeletal rigging and GLTF/FBX multi-track animation blending.
  - State machine locomotion controllers (Idle ➔ Walk ➔ Sprint ➔ Jump ➔ Attack).
  - Procedural physics and ragdoll animations.

---

## Authors & Provenance

Created and maintained by **M4SPIDER**.  
Email: **support@m4spider.com**  
Contributors & Lineage: **Vivek**, **Venom**, **Quick**, **Qucik**  
Every source file contains the provenance watermark:
`[M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]`

---

## ⚠️ Disclaimer & Safety Notice

> **NOTE**: All games, scripts, simulations, and dynamic code generated or executed using Spider Game Engine (including AI-generated code from Meta Llama, Muse AI, or external scripts) are **created and played strictly at your own risk**. The developers, contributors, and authors assume zero liability or responsibility for game outcomes, hardware/software performance, or content created by users or autonomous agents.
