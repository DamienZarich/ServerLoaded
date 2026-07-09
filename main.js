const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const si = require('systeminformation');
const Store = require('electron-store');
const store = new Store.default()
const savedPath = store.get('lastServerPath')
let serverStartTime = null;

ipcMain.handle('open-folder-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
 if (canceled) return {status: 'canceled'};
 const folderPath = filePaths[0];
 const detectedGame = identifyServer(folderPath);

 if(!detectedGame) {
  return {status: 'error'};
 }
 store.set('lastServerPath', folderPath);
 return {status: 'success', path: folderPath, game: detectedGame};
})
const gameSignatures = {
  "Minecraft": "server.properties",
  "Rust": "server.cfg",
  "Ark": "ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini"
};
function identifyServer(folderPath) {
  for (const [game, file] of Object.entries(gameSignatures)) {
    if (fs.existsSync(path.join(folderPath, file))) {
      return game;
    }
  }
  return null;
}
ipcMain.handle('start-server', async (event, serverPath) => {
  const serverFound = identifyServer(serverPath)
  if (!serverFound) {
    return {success: false, message: "Could Not Locate Files"}
  }
  serverStartTime = Date.now();
  return {success: true};
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html')
}
  ipcMain.handle('get-stats', async () => {
      const cpu = await si.currentLoad ();
      const mem = await si.mem ();
      const memPercent = Math.round((mem.active / mem.total) * 100);
      const usedMemMB = Math.round(mem.active /1024 / 1024);
      const totalMemMB = Math.round(mem.total /1024 / 1024);

      let uptimeString = "00:00:00";
      if (serverStartTime) {
        const totalSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
        const hours = Math.floor (totalSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor ((totalSeconds % 3600) / 60).toString().padStart(2,'0');
        const seconds = (totalSeconds %60).toString().padStart(2, '0');
        uptimeString = `${hours}:${minutes}:${seconds}`;
      }
      return {
        cpu: Math.round(cpu.currentLoad) +"%",
        memory: memPercent + "%",
        usedMemoryMB: usedMemMB,
        totalMemoryMB: totalMemMB,
        uptime: uptimeString
      }
      return store.get('lastServerPath') || "";
    });
app.whenReady().then(createWindow); 