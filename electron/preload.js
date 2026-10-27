const { contextBridge, ipcRenderer } = require('electron')

// Spider Engine shell API. The live MCP tool surface (listScene, spawnObject,
// moveObject, setVisibility, setTime, play, getScore, ask) is attached by the
// React app itself as window.spiderEngine once the scene boots — see app.jsx.
// Keeping that namespace free (no stub) so the page can own it.
contextBridge.exposeInMainWorld('spiderShell', {
  version: '0.9.0',
  platform: process.platform,
  // OS-keychain encryption (DPAPI on Windows) — Meta API key never sits in plain text
  encryptString: (plain) => ipcRenderer.invoke('spider-encrypt', plain),
  decryptString: (cipher) => ipcRenderer.invoke('spider-decrypt', cipher),
  encryptionAvailable: () => ipcRenderer.invoke('spider-encryption-available')
})
