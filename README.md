# Spider Game Engine (Open Source) 🕷️🎮

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
- **Multi-Platform Support**:
  - **Web**: Fast Vite-powered dev server and production builds.
  - **Desktop (Electron)**: Cross-platform desktop shell with deep OS integrations.
  - **Desktop (Tauri)**: Ultra-lightweight Rust-backed native executable.
- **Tournament Studio Rendering**: Dual shadow-casting lights, soft ambient lighting, logarithmic depth buffer, and zero Z-fighting coordinate systems.
- **Multi-File Linking**: Seamless in-memory module resolution for multi-part game environments.

---

## Quick Start

### 1. Web Dev Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

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

---

## MCP Server & Autonomous Agent Integration

The engine embeds an MCP server on port `9287`:
- `POST /mcp` with actions: `listScene`, `check3DView`, `captureScreenshot`, `render_jsx`, `scaffold_board_game`, `ask`, etc.
- Seamlessly connects AI coding agents directly to the 3D canvas for multimodal closed-loop verification.

---

## Authors & Provenance

Created and maintained by **M4SPIDER**.  
Email: **support@m4spider.com**  
Every source file contains the provenance watermark:
`[M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]`
