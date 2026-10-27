const { app, BrowserWindow, ipcMain, safeStorage } = require('electron')
const path = require('path')
const contextMenuModule = require('electron-context-menu')
const contextMenu = contextMenuModule.default || contextMenuModule

// Right-click menu: Copy for selections, Cut/Copy/Paste for inputs, Inspect in dev
contextMenu({
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  prepend: () => []
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Spider Engine v0.9.0',
    backgroundColor: '#f0f2f8',
    autoHideMenuBar: true,
    show: false,
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
    win.maximize()
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
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
