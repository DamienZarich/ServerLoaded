const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const si = require('systeminformation');
const Store = require('electron-store');
const net = require('net');
const { eventLoopUtilization } = require('perf_hooks');
const store = new Store.default();
let serverAddress = null;
let serverStartTime = null;


ipcMain.handle('get-saved-path', async () => {
  return store.get('lastServerPath') || "";
});
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
 const savedIP = store.get(`ips.${folderPath}`) || "";
 return {status: 'success', path: folderPath, game: detectedGame, savedIP: savedIP};
});

ipcMain.handle('save-server-address', async (event, folderPath, ipAddress) => {
  if (folderPath && ipAddress) {
    store.set(`ips.${folderPath}`, ipAddress)
  }
  return true;
});
ipcMain.handle('get-ip-for-path', async (event, folderPath) => {
  return store.get(`ips.${folderPath}`) || ""
});
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
function checkServerStatus(address) {
  if (!address || address.trim() === "") {
    return Promise.resolve(false);
  }
  const folderPath = store.get('lastServerPath')
  const gameType = identifyServer(folderPath)
  const gamePorts = {
    "Minecraft": 25565,
    "Ark": 7777,
    "Rust": 28015
  }
  const ports = gamePorts[gameType] || 25565
  return new Promise((resolve) => {
    const socket = net.createConnection(ports, address);
    socket.setTimeout(1000);
    socket.on('connect', () => {
    resolve(true);
    socket.destroy();
  });

socket.on('timeout', () => {
    resolve(false);
    socket.destroy();
  });

socket.on('error', () => {
    resolve(false);
    socket.destroy();
  });
    })
}
ipcMain.handle('start-server', async (event, serverPath, incomingAddress) => {
  const serverFound = identifyServer(serverPath) 
  serverAddress = incomingAddress
  if (!serverFound) {
    return {success: false, message: "Could Not Locate Files"}
  }
  return {success: true};
});
ipcMain.handle('reset', async (event, serverPath) => {
 serverAddress = null
 serverStartTime = null
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
      let isOnline = false
      if (serverAddress !== null && serverAddress !== "") {
        isOnline = await checkServerStatus(serverAddress);

        if (isOnline && !serverStartTime) {
          serverStartTime = Date.now();
        }
        else if (!isOnline) {
          serverStartTime = null;
        }
      }
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
        uptime: uptimeString,
        online: isOnline
      }
    });
app.whenReady().then(createWindow); 