const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const si = require('systeminformation');
const Store = require('electron-store');
const net = require('net');
const { channel } = require('diagnostics_channel');
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
ipcMain.handle('open-folder-channel', async (event, folderPath) => {
  if (fs.existsSync(folderPath)) {
    await shell.openPath(folderPath);
    return {success: true}
  } else {
    return {success: false, message: "Folder Not Found"}
  }
})
ipcMain.handle('open-config-channel', async (event, folderPath) => {
  const gameType = identifyServer(folderPath)
  const configFile = gameSignatures[gameType];
  const fullPath = path.join(folderPath, configFile);
  if (fs.existsSync(fullPath)) {
  await shell.openPath(fullPath);
  return {success: true};
  } else {
    return {success: false, message: `Config file (${configFile}) not found`};
  }
})
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
    return Promise.resolve({online: false, latency: null});
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
    let socket;
    const startTime = performance.now();
    try {
    socket = net.createConnection(ports, address);
    socket.setTimeout(1000);
  } catch (err) {
    resolve({online: false, latency: null});
    return;
    }
    socket.on('connect', () => {
    const latency = Math.round(performance.now() - startTime);
    resolve({online: true, latency: latency});
    socket.destroy();
  });
socket.on('timeout', () => {
    resolve({online: false, latency: null});
    socket.destroy();
  });

socket.on('error', () => {
    resolve({online: false, latency: null});
    socket.destroy();
  });
 });
}
ipcMain.handle('start-server', async (event, serverPath, incomingAddress) => {
  const serverFound = identifyServer(serverPath) 
  serverAddress = incomingAddress
  if (!serverFound) {
    return {success: false, reason: "files", message: "Could Not Locate Files"}
  }
  const statusReady = await checkServerStatus(serverAddress);
  if (!statusReady.online) {
    return {success: false, reason: "network", message: "Server IP is incorrect or unreachable"};
  }
  return {success: true};
});
ipcMain.handle('ResetServer', async (event, serverPath) => {
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
      nodeIntegration: false
    }
  });
  win.loadFile('index.html')
}
  ipcMain.handle('create-server-backup', async() => {
    const currentPath = store.get('lastServerPath')
    const gameType = identifyServer(currentPath)
    if (gameType === null) {
     return {success: false, message: "Unitetified Game Type"}
    }
    const saveFiles = {
      "Minecraft": "world",
      "Ark": "ShooterGame/Saved",
      "Rust": "server"
    };
    const targetFolder = saveFiles[gameType];
    const fullSourcePath = path.join(currentPath, targetFolder)
    if (!fs.existsSync(fullSourcePath)) {
      return {success: false, message: "Save Files Not FoundA"}
    }
    const backupdir = path.join(currentPath, 'Dashboard-Backups');
    if (!fs.existsSync(backupdir)) {
      fs.mkdirSync(backupdir, {recursive: true});
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const destinationPath = path.join(backupdir, `${gameType}-Backup-${timestamp}`)

    try {
      fs.cpSync(fullSourcePath, destinationPath, {recursive: true})
      return {success: true, message: "Backup Has Been Created"}
    } catch (error) {
      console.error("Backup Failded:", error);
      return {success: false, message: "Failed To Create Backup"}
    }
  })
  ipcMain.handle('get-stats', async () => {
      let statusState = "OFFLINE"
      let currentLatency = null;
      if (serverAddress && typeof serverAddress === 'string' && serverAddress.trim() !== "") {
        statusState = "NONE";
      } else {
        const statusReady = await checkServerStatus(serverAddress);
        isOnline = statusReady.online;
        currentLatency = statusReady.latency;

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
      if (serverStartTime && statusState === "ONLINE") {
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
        online: isOnline,
        status: statusState,
        latency: currentLatency
      }
    });
app.whenReady().then(createWindow); 