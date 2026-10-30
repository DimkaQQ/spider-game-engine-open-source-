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

## 🌟 Key Features

- **Meta Muse Real-Time Voice Transcribe (3.1% WER)**: Ultra-low latency (~0.16s) live speech-to-text recognition streaming over WebSockets (`wss://api.meta.ai/v1/asr/realtime`) with native turn endpointing and zero ambient noise hallucinations.
- **Spider Slash Commands**: Instant slash command palette (`/blender`, `/plan`, `/play`, `/browser`, `/clear`, `/stop`, `/help`) with keyboard navigation and autocomplete.
- **Blender Real-Time MCP Bridge**: Live bi-directional bridge on port `9876` connecting Spider Engine directly to Blender for real-time asset, geometry, and lighting sync.
- **Real-Time Dynamic JSX Engine**: Live mounting of arbitrary React Three Fiber components with instant AST compilation cache.
- **Autonomous Agentic Loop**: Built-in MCP server (`http://localhost:9287/mcp`) supporting live inspection, screenshot capture, 3D viewport verification, and autonomous game generation.
- **Full CLI Command Execution (Desktop)**: The AI agent can run native shell commands (`powershell.exe` on Windows, `/bin/bash` on Linux/Unix) with live streaming output.
- **System-Wide File Creation**: Create, edit, and organize files anywhere on the computer with automatic recursive directory scaffolding.
- **Dual Permission Governance**: Toggle between **Ask Permission (Secure Mode)** for interactive review and **Auto Mode (No Permission)** for 100% autonomous agent execution.
- **Universal Browser & Mobile Support**: Runs in **ANY modern browser** (Chrome, Firefox, Safari, Edge, Arc, Brave) and on **mobile phones & tablets** (iOS & Android) with zero setup required.
- **Live Concurrent Chat (Chat While Streaming)**: Chat with the agent anytime *while it is working without stopping streaming* — steer, add ideas, and guide the agent mid-flight.
- **Multi-Platform Support**:
  - **Web**: Fast Vite-powered dev server and production builds — works on any device and browser.
  - **Desktop (Windows Electron)**: Desktop shell with deep OS integrations.
  - **Desktop (Windows Tauri)**: Ultra-lightweight Rust-backed native executable.
- **Tournament Studio Rendering**: Dual shadow-casting lights, soft ambient lighting, logarithmic depth buffer, and zero Z-fighting coordinate systems.
- **Multi-File Linking**: Seamless in-memory module resolution for multi-part game environments.

---

## 🏛️ Engine Architecture Diagrams (7 Core Systems)

### Diagram 1: High-Level System Architecture & Cross-Platform Runtime
```mermaid
flowchart TD
    subgraph ClientPlatforms["Multi-Platform Host Environments"]
        WebBrowser["🌐 Web Browser\n(Vite + React 19 + WebGL)"]
        ElectronApp["⚡ Electron Desktop\n(Chromium + Node.js IPC + DPAPI)"]
        TauriApp["🦀 Tauri Native\n(Rust Backend + Webview)"]
    end

    subgraph UIShell["Spider Studio UI Shell"]
        SearchBar["Spider AI Search Bar\n(Camera, File Attachment, Meta Mic, Send)"]
        SlashPalette["Slash Commands Palette\n(/blender, /plan, /play, /browser)"]
        ViewportTabs["Viewport Manager\n(Game View | Viewport | Stats | Title)"]
        ConsoleLogs["Live Engine Console & Log Stream"]
    end

    subgraph CoreEngine["Core Game Engine Services"]
        DynamicJSX["Dynamic JSX AST Compiler\n(Babel Standalone + In-Memory Linker)"]
        ThreeCanvas["Three.js 3D Viewport\n(@react-three/fiber + Drei + WebGL2)"]
        MCPServer["MCP Server Bridge\n(Port 9287 HTTP JSON-RPC)"]
        BlenderBridge["Blender Real-Time Bridge\n(Port 9876 TCP Socket)"]
    end

    subgraph AICloud["AI Intelligence & Voice Cloud"]
        MetaASR["Meta Muse Real-Time ASR\n(wss://api.meta.ai/v1/asr/realtime)"]
        MetaModels["Meta Model API / LLM\n(muse-spark-1.3 / muse-wonder)"]
    end

    WebBrowser --> UIShell
    ElectronApp --> UIShell
    TauriApp --> UIShell
    UIShell --> CoreEngine
    SearchBar <--> MetaASR
    UIShell <--> MetaModels
    CoreEngine <--> MCPServer
    CoreEngine <--> BlenderBridge
```

---

### Diagram 2: Meta Muse Real-Time ASR & Voice Pipeline (3.1% WER)
```mermaid
sequenceDiagram
    autonumber
    actor User as 🎙️ User / Game Developer
    participant UI as Spider AI Search Bar
    participant AudioPipeline as Web Audio API (16kHz PCM)
    participant WS as Meta Muse WebSocket (api.meta.ai)
    participant Engine as Chat Input & Engine Context

    User->>UI: Click Microphone Button
    UI->>AudioPipeline: Initialize getUserMedia (echoCancellation, noiseSuppression)
    UI->>WS: Connect wss://api.meta.ai/v1/asr/realtime?sessionId=stream-xyz
    WS-->>UI: WebSocket OPEN
    UI->>WS: Handshake Frame { authorization: "Bearer LLM_...", audioEncoding: "PCM_16KHZ", model: "muse-voice-transcribe-1.0" }
    WS-->>UI: Handshake Acknowledged { sessionId: "stream-xyz" }

    loop Continuous Live Speech
        User->>AudioPipeline: Speaks voice instructions
        AudioPipeline->>WS: Send binary 16-bit Int16 PCM chunk (4096 samples / 250ms)
        WS-->>Engine: Receive { type: "transcript", transcript: "partial text...", final: false }
        Engine->>UI: Render live partial text directly in prompt box
    end

    User->>UI: Click Microphone Button to Stop
    UI->>WS: Send { type: "endStream" }
    WS-->>Engine: Receive { type: "transcript", transcript: "final sentence.", final: true }
    Engine->>UI: Commit final sanitized text & expand textarea
    UI->>WS: Close WebSocket cleanly (Code 1000)
    UI->>AudioPipeline: Disconnect ScriptProcessor & release microphone tracks
```

---

### Diagram 3: Autonomous Agent Closed-Loop Verification (MCP Server Architecture)
```mermaid
flowchart LR
    subgraph Agent["Autonomous AI Agent"]
        Planner["Reasoning & Planner\n(Meta Llama / Muse AI)"]
        ToolCaller["MCP Tool Dispatcher"]
    end

    subgraph MCPEndpoint["Spider Engine MCP Server (Port 9287)"]
        HTTPGateway["POST /mcp Router"]
        ActionHandler{"Tool Action Handler"}
        ListScene["listScene"]
        RenderJSX["render_jsx"]
        MoveObject["moveObject"]
        Check3D["check3DView"]
        CaptureSS["captureScreenshot"]
        RunCmd["runCommand"]
    end

    subgraph ViewportCanvas["Three.js 3D Canvas"]
        SceneGraph["Live Scene Graph\n(Hierarchy, Meshes, Lights)"]
        WebGLBuffer["WebGL Framebuffer (RGB/Depth)"]
    end

    Planner --> ToolCaller
    ToolCaller -->|HTTP JSON-RPC| HTTPGateway
    HTTPGateway --> ActionHandler
    ActionHandler --> ListScene
    ActionHandler --> RenderJSX
    ActionHandler --> MoveObject
    ActionHandler --> Check3D
    ActionHandler --> CaptureSS
    ActionHandler --> RunCmd

    RenderJSX -->|Hot Mount| SceneGraph
    MoveObject -->|Transform| SceneGraph
    SceneGraph --> WebGLBuffer
    CaptureSS -->|Extract Base64 JPG| WebGLBuffer
    WebGLBuffer -->|Multimodal Visual Feedback| Planner
```

---

### Diagram 4: Dynamic JSX AST Compilation & Hot Mount Pipeline
```mermaid
flowchart TD
    RawCode["User Chat Prompt / Agent Code File\n(React Three Fiber JSX)"] --> ASTValidator["Syntax & AST Validation Gate"]
    ASTValidator --> BabelCompiler["Babel Standalone Transpiler\n(React 19 JSX ➔ React.createElement)"]
    
    subgraph ModuleResolver["In-Memory Multi-File Resolver"]
        ImportScanner["Import Scanner\n(Detects './assets.js', './rules.js')"]
        VirtualFileSystem["In-Memory Virtual File Map\n(Resolves local imports without bundler)"]
        DependencyLinker["Dynamic Closure Dependency Linker"]
    end

    BabelCompiler --> ImportScanner
    ImportScanner --> VirtualFileSystem
    VirtualFileSystem --> DependencyLinker
    DependencyLinker --> DynamicJsxRenderer["DynamicJsxRenderer Component\n(Error Boundary + Fallback Shell)"]
    
    DynamicJsxRenderer --> Reconciliation{"Three.js Scene Reconciliation"}
    Reconciliation -->|Success| LiveCanvas["Mount into Active 3D Canvas\n(Preserve Camera & Physics State)"]
    Reconciliation -->|Error| ErrorLog["Capture Stack Trace ➔ Feed to Agent for Auto-Fix"]
```

---

### Diagram 5: Blender Real-Time MCP Bridge Architecture
```mermaid
flowchart LR
    subgraph SpiderEngineDesktop["Spider Engine (Desktop Shell)"]
        UIBridge["Blender MCP UI Toggle\n(/blender slash command)"]
        IPCMain["Electron main.js IPC\n(spider-blender-connect)"]
        TCPClient["Node.js Net Socket Client\n(Host: 127.0.0.1, Port: 9876)"]
    end

    subgraph BlenderApplication["Blender 3D Suite"]
        TCPServer["Spider Blender Add-on\n(Python Socket Server :9876)"]
        BlenderScene["Blender Active Scene\n(Collections, Objects, Shaders)"]
        DataSync["Geometry & Transform Exchanger\n(JSON Protocol)"]
    end

    UIBridge --> IPCMain
    IPCMain --> TCPClient
    TCPClient <-->|Bi-Directional TCP Stream :9876| TCPServer
    TCPServer <--> DataSync
    DataSync <--> BlenderScene
```

---

### Diagram 6: Multi-Tier State, Storage & DPAPI Encryption Architecture
```mermaid
flowchart TD
    subgraph SecurityBoundary["Operating System Security Layer"]
        DPAPI["Windows DPAPI / OS Keychain\n(CryptProtectData / CryptUnprotectData)"]
    end

    subgraph StorageTiers["Multi-Tier Storage Architecture"]
        MemoryRef["Tier 1: Volatile Memory\n(React Refs, Three.js Geometries, AST Cache)"]
        LocalStorage["Tier 2: LocalStorage\n(Encrypted API Key, Models, UI Settings)"]
        IndexedDB["Tier 3: IndexedDB Database\n(3D Project Scenes, Compiled Game History)"]
        DiskFileSystem["Tier 4: Real Disk File System\n(Desktop electron fs / tauri-fs)"]
    end

    DPAPI <-->|spider-encrypt / spider-decrypt| LocalStorage
    MemoryRef -->|Flush State| LocalStorage
    MemoryRef -->|Persist Project| IndexedDB
    IndexedDB -->|Save / Export .exe| DiskFileSystem
```

---

### Diagram 7: 3D Game Viewport & Physics Engine Pipeline
```mermaid
flowchart TD
    subgraph InputControls["Input & Camera Management"]
        KeyboardMouse["Locomotion Controls (WASD / Arrows / Space)"]
        OrbitCam["OrbitControls / First-Person / Follow Camera"]
    end

    subgraph SimulationLoop["Frame Simulation Loop (useFrame / 60 FPS)"]
        DeltaTime["Delta Time Normalizer\n(Math.min(dt, 0.033))"]
        CollisionDetection["Collision Detection & Raycasting\n(AABB, Ground Ray, Obstacle Sweep)"]
        PhysicsStep["Physics Step & Velocity Solver\n(Gravity, Friction, Momentum)"]
        AnimationBlender["Locomotion State Blender\n(Idle ➔ Walk ➔ Run ➔ Jump)"]
    end

    subgraph RenderOutput["Tournament Studio Render Pipeline"]
        LightingRig["Studio Lighting Rig\n(Sun Directional, Shadow Maps, Soft Ambient)"]
        ToneMapping["ACESFilmic ToneMapping & Color Space (sRGB)"]
        DepthBuffer["Logarithmic Depth Buffer (Zero Z-Fighting)"]
        CanvasBuffer["Rendered 3D WebGL Canvas\n(Anti-Aliasing Enabled)"]
    end

    KeyboardMouse --> DeltaTime
    OrbitCam --> DeltaTime
    DeltaTime --> CollisionDetection
    CollisionDetection --> PhysicsStep
    PhysicsStep --> AnimationBlender
    AnimationBlender --> LightingRig
    LightingRig --> ToneMapping
    ToneMapping --> DepthBuffer
    DepthBuffer --> CanvasBuffer
```

---

## ⚡ Full Agent Capabilities & System Access

Spider Game Engine grants AI agents complete developer execution capabilities with configurable governance:

### 1. 🎙️ Meta Muse Real-Time Speech Perception (3.1% WER)
- **Direct Neural Streaming**: Streams microphone audio packets in real-time to Meta’s `muse-voice-transcribe-1.0` model via WebSockets (`wss://api.meta.ai/v1/asr/realtime`).
- **Low Latency & High Precision**: ~0.16-second latency with 3.1% Word Error Rate.
- **Zero Hallucination Guarantee**: Eliminates archaic acoustic misinterpretations and ambient room noise hallucinations.

### 2. 🖥️ Real CLI Command Execution (`runCommand`)
- **Native Shell Power**: In desktop mode (Electron / Tauri), the AI agent can execute arbitrary shell commands directly on the host computer (`powershell.exe` on Windows, `/bin/bash` / `zsh` on Linux/Unix).
- **Live Output Streaming**: Captures real-time `stdout` and `stderr` streams directly into the engine's debug console and agent reasoning context.
- **Workflow Automation**: Build projects, run package managers (`npm install`, `cargo build`), trigger git operations, compile standalone executables, and run diagnostic scripts automatically.

### 3. 📂 Deep File System Access (Create Files Anywhere on Computer)
- **System-Wide File Creation**: Create, read, edit, and organize files in any directory or path across the computer with automatic recursive directory creation (`fs.mkdirSync`).
- **Asset & Project Pipelines**: The agent can scaffold complete multi-folder game structures (`src/`, `assets/`, `audio/`, `models/`), write React Three Fiber components, convert textures, and link modular imports on the fly.
- **File Watching & Live Hot-Reloading**: Real-time folder watching instantly updates the in-memory 3D runtime whenever files change on disk.

### 4. 🛡️ Dual Permission & Security Modes

You have 100% control over how the AI agent interacts with your system:

| Mode | Behavior | Best Used For |
| :--- | :--- | :--- |
| **🛡️ Ask Permission (Secure Mode)** | **Interactive Approval Gate**: The agent pauses and displays an approval card before running CLI commands, creating files, or making critical scene edits. You can review the exact command or file path and click **Allow** or **Deny**. | Safe development, critical project environments, and step-by-step code review. |
| **⚡ Auto Mode (No Permission / Autonomous)** | **Zero-Friction Autonomy**: The agent executes CLI commands, creates files anywhere, and mounts 3D scenes automatically without pausing for permission. | High-speed prototyping, autonomous overnight game development, and unattended CI/agent loops. |

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

---

## MCP Server & Autonomous Agent Integration

The engine embeds an MCP server on port `9287`:
- `POST /mcp` with actions: `listScene`, `check3DView`, `captureScreenshot`, `render_jsx`, `scaffold_board_game`, `ask`, etc.
- Seamlessly connects AI coding agents directly to the 3D canvas for multimodal closed-loop verification.

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
