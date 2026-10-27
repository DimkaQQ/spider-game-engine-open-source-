const { app, BrowserWindow, ipcMain, safeStorage, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const contextMenuModule = require('electron-context-menu')
const contextMenu = contextMenuModule.default || contextMenuModule

// Right-click menu: Copy for selections, Cut/Copy/Paste for inputs, Inspect in dev
contextMenu({
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  prepend: () => []
})

// MCP bridge — localhost HTTP so any MCP client (Claude Code/Desktop, agents)
// can drive the LIVE engine: POST /mcp {"tool":"spawnObject","args":{"name":"castle"}}
const MCP_PORT = 9287;
function toolCallExpr(tool, args) {
  const map = {
    listScene: `window.spiderEngine.listScene()`,
    spawnObject: `window.spiderEngine.spawnObject(${JSON.stringify(args.name || "")})`,
    moveObject: `window.spiderEngine.moveObject(${JSON.stringify(args.id || "")},${args.x ?? "undefined"},${args.y ?? "undefined"},${args.z ?? "undefined"})`,
    setVisibility: `window.spiderEngine.setVisibility(${JSON.stringify(args.id || "")},${!!args.visible})`,
    setTime: `window.spiderEngine.setTime(${Number(args.t)})`,
    play: `window.spiderEngine.play(${!!args.on})`,
    getScore: `window.spiderEngine.getScore()`,
    ask: `window.spiderEngine.ask(${JSON.stringify(String(args.text || ""))})`
  };
  if (!map[tool]) throw new Error(`unknown tool: ${tool} (engine tools: listScene, spawnObject, moveObject, setVisibility, setTime, play, getScore, ask)`);
  return `(async () => { if (!window.spiderEngine) throw new Error("engine bridge not ready — open the app first"); return (${map[tool]}); })()`;
}
function startMcpBridge() {
  const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, mcp: "spider-engine", tools: ["listScene", "spawnObject", "moveObject", "setVisibility", "setTime", "play", "getScore", "ask"] }));
      return;
    }
    if (req.method !== "POST" || req.url !== "/mcp") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "POST /mcp only (GET /health for tool list)" }));
      return;
    }
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on("end", async () => {
      try {
        const { tool, args } = JSON.parse(body || "{}");
        const wins = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed());
        if (wins.length === 0) throw new Error("engine window not open");
        // Prefer the editor window (the one with a loaded page), not the splash
        const win = wins.find((w) => { try { return w.webContents.getURL().includes("dist/index.html") || w.webContents.getURL().startsWith("http"); } catch { return false; } }) || wins[0];
        const result = await win.webContents.executeJavaScript(toolCallExpr(String(tool || ""), args || {}), true);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, result: result === undefined ? null : result }));
      } catch (err) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: String((err && err.message) || err) }));
      }
    });
  });
  server.on("error", () => {});
  server.listen(MCP_PORT, "127.0.0.1");
}

function createSplash() {
  // File-Explorer-shaped splash: small native window with title bar, then hands off
  const splash = new BrowserWindow({
    width: 560,
    height: 360,
    backgroundColor: '#ffffff',
    resizable: false,
    frame: false,
    center: true,
    show: false,
    icon: path.join(__dirname, '../build/icon-square.png'),
  })
  splash.loadFile(path.join(__dirname, 'splash.html'))
  splash.once('ready-to-show', () => splash.show())
  return splash
}

function createWindow() {
  const win = new BrowserWindow({
    width: 560,
    height: 360,
    useContentSize: true,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    show: false,
    center: true,
    minimizable: false,
    maximizable: false,
    resizable: false,
    autoHideMenuBar: true,
    show: false,
    center: true,
    minimizable: false,
    maximizable: false,
    icon: path.join(__dirname, '../build/icon-square.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
  const distFile = path.join(__dirname, '../dist/index.html')
  const fs = require('fs')
  if (!app.isPackaged && process.argv.includes('--built')) {
    win.loadFile(distFile)
  } else if (!app.isPackaged) {
    win.loadURL(devUrl).catch(() => {
      if (fs.existsSync(distFile)) win.loadFile(distFile)
    })
  } else {
    win.loadFile(distFile)
  }
  win.once('ready-to-show', () => {
    // Picker-sized window only — expands to full editor on spider-project-open
    win.show()
    win.focus()
  })
}

app.whenReady().then(() => {
  // OS-keychain crypto for the Meta API key (DPAPI on Windows, Keychain on macOS)
  ipcMain.handle('spider-encryption-available', () => {
    try {
      return safeStorage.isEncryptionAvailable()
    } catch {
      return false
    }
  })
  ipcMain.handle('spider-encrypt', (_e, plain) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) return { ok: false, error: 'OS encryption unavailable' }
      return { ok: true, cipher: safeStorage.encryptString(String(plain)).toString('base64') }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
  ipcMain.handle('spider-decrypt', (_e, cipher) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) return { ok: false, error: 'OS encryption unavailable' }
      return { ok: true, plain: safeStorage.decryptString(Buffer.from(String(cipher), 'base64')) }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
  // Project folders + files on real disk
  ipcMain.handle('spider-pick-folder', async (e) => {
    try {
      const win = BrowserWindow.fromWebContents(e.sender) || undefined
      const r = await dialog.showOpenDialog(win || undefined, { properties: ['openDirectory', 'createDirectory'] })
      if (r.canceled || !r.filePaths || r.filePaths.length === 0) return { ok: false, cancelled: true }
      return { ok: true, dir: r.filePaths[0] }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
  ipcMain.handle('spider-write-file', (_e, { dir, name, contents }) => {
    try {
      if (!dir || !name) return { ok: false, error: 'missing path' }
      fs.mkdirSync(dir, { recursive: true })
      const full = path.join(dir, name)
      fs.writeFileSync(full, String(contents), 'utf8')
      return { ok: true, path: full }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
  // Project lifecycle: small picker window first (X only), full framed editor after open
  ipcMain.handle('spider-project-open', (e) => {
    try {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (win && !win.isDestroyed()) {
        win.setResizable(true);
        win.setMinimizable(true);
        win.setMaximizable(true);
        if (!win.isVisible()) win.show();
        win.maximize();
        win.focus();
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  })
  startMcpBridge()
  const splash = createSplash()
  // Hand off: splash shows ~2s while the editor loads behind, then swaps
  setTimeout(() => {
    createWindow()
    const main = BrowserWindow.getAllWindows().find((w) => w !== splash)
    if (main) {
      main.once('ready-to-show', () => {
        if (!splash.isDestroyed()) splash.close()
      })
      // Safety: never trap the user behind a stuck splash
      setTimeout(() => { if (!splash.isDestroyed()) splash.close() }, 6000)
    } else if (!splash.isDestroyed()) {
      splash.close()
    }
  }, 2100)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
