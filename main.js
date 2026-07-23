const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage} = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const si = require('systeminformation');
const Store = require('electron-store');
const net = require('net');
const { channel } = require('diagnostics_channel');
const { GameDig } = require('gamedig');
const { error } = require('console');
const { uptime } = require('process');
const store = new Store.default();
let serverAddress = null;
let serverStartTime = null;

function safePath(basePath, ...segments) {
  const resolvedBase = path.resolve(basePath);
  const resolvedPath = path.resolve(resolvedBase, ...segments);
  const baseWithSep = resolvedBase.endsWith(path.sep) ? resolvedBase : resolvedBase + path.sep;
  if (!resolvedPath.startsWith(baseWithSep) && resolvedPath !== resolvedBase) {
    throw new Error("Path traversal attempt detected!");
  }
  return resolvedPath;
}

function isValidAddress(address) {
  if (!address || typeof address !== 'string' || address.length > 253) return false;
  let clean = address.replace(/^\[|\]$/g, '');
  if (clean.includes(':') && !net.isIPv6(clean)) {
    clean = clean.split(':')[0];
  }
  if (net.isIP(clean) !== 0) return true;
  const domainRegex = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]))*$/;
  return domainRegex.test(clean);
}
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
  if (!folderPath || typeof folderPath !== 'string') return {success: false, message: "Invalid Path"};
  try {
    const currentPath = store.get('lastServerPath');

    if (!currentPath) return {success: false, message: "No Server Path Configured"}
    const cleanPath = safePath(currentPath, path.relative(currentPath, folderPath));

    if (fs.existsSync(cleanPath)) {
      const stat = fs.lstatSync(cleanPath);
      if (stat.isDirectory()) {
        await shell.openPath(cleanPath);
        return {success: true};
      }
    }
    return {success: false, message: "Folder Not Found"};
  } catch (e) {
    return {success: false, message: "Access Denied"};
  }
});
ipcMain.handle('open-config-channel', async (event, folderPath) => {
      try {
        const currentPath = store.get('lastServerPath');
        if (!currentPath) return {success: false, message: "Unidentified Game Folder"};
        
        const gameType = identifyServer(currentPath);
        if (!gameType) return {success: false, message: "Unidentified Game Folder"};

        const configFile = gameSignatures[gameType];
        if (configFile.endsWith('.exe')) {
          return {success: false, message: "Securtiy Block: Cant Edit .exe File"}
        }

        const fullPath = safePath(currentPath, configFile);

        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, 'utf-8')
          return {success: true, message: "Config File Does NOt Exist"}
        }
      }
});
ipcMain.handle('get-ip-for-path', async (event, folderPath) => {
  return store.get(`ips.${folderPath}`) || ""
});
const gameSignatures = {
  "Minecraft": "server.properties",
  "Rust": "server.cfg",
  "Ark": "ArkAscendedServer.exe"
};
function identifyServer(folderPath) {
  if (!folderPath || typeof folderPath !== 'string') return null;
  try {
  for (const [game, file] of Object.entries(gameSignatures)) {
    if (fs.existsSync(safePath(folderPath, file))) {
      return game;
    }
  }
} catch(e) {
  return null;
}
return null;
}
function checkServerStatus(address) {
  if (!address || address.trim() === "") {
    return Promise.resolve({online: false, latency: null});
  }
  const folderPath = store.get('lastServerPath');
  if (!folderPath) {
    return Promise.resolve({online: false, latency: null, players: 0, maxplayers: 0});
  }
  const gameType = identifyServer(folderPath)
  const gameDigMap = {
    "Minecraft": "minecraft",
    "Ark": "asa",
    "Rust": "rust"
  };
 const gameId = gameDigMap[gameType];
 if (!gameId) {
  return Promise.resolve({online: false, latency: null, players: 0, maxplayers: 0})
 };
 return GameDig.query({
  type: gameId,
  host: address,
  socketTimeout: 2000
 })
 .then((state) => {
  return {
    online: true,
    latency: state.ping,
    players: state.players ? state.players.length : 0,
    maxplayers: state.maxplayers || 0
  };
 })
 .catch(() => {
  return {online: false, latency: null, players: 0, maxplayers: 0};
 });
}
ipcMain.handle('start-server', async (event, serverPath, incomingAddress) => {
  try {
    if (!isValidAddress(incomingAddress)) {
      return { success: false, message: "Invalid Format", reason: "Security" };
    }
    const serverFound = identifyServer(serverPath);
    if (!serverFound) {
      return { success: false, reason: "files", message: "Could Not Locate Files" };
    }
    const statusReady = await checkServerStatus(incomingAddress);
    if (!statusReady.online) {
      return { success: false, reason: "network", message: "Server IP is incorrect or unreachable" };
    }
    serverAddress = incomingAddress;
    return { success: true };
  } catch (error) {
    console.error("Failed To Start Server Check:", error);
    return { success: false, reason: "error", message: "Internal Server Check Error" };
  }
});
ipcMain.handle('ResetServer', async (event, serverPath) => {
 serverAddress = null
 serverStartTime = null
 return {success: true};
});
function createWindow() {
  const iconPath = path.join(app.getAppPath(), 'server-manager-icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  console.log("Icon empty?:", icon.isEmpty());
  
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    frame: false,
    backgroundColor: '#0d0d0d',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  ipcMain.on('window-min', () => win.minimize());
  ipcMain.on('window-max', () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.on('window-close', () => win.close());
  win.loadFile('index.html')
}
  ipcMain.handle('create-server-backup', async() => {
    const currentPath = store.get('lastServerPath')
    if (!currentPath || typeof currentPath !== 'string') return {success: false, message: ""}
    try {
    const cleanCurrentPath = path.resolve(currentPath);
    const gameType = identifyServer(currentPath);
    if (gameType === null) {
     return {success: false, message: "Unitetified Game Type"}
    }
    const saveFiles = {
      "Minecraft": "world",
      "Ark": "ShooterGame/Saved",
      "Rust": "server"
    };
    const targetFolder = saveFiles[gameType];

    const fullSourcePath = safePath(cleanCurrentPath, targetFolder);
    const backupdir = safePath(cleanCurrentPath, 'Dashboard-Backups');
    if (!fs.existsSync(fullSourcePath)) {
      return {success: false, message: "Save Files Not Found"}
    }
    if (!fs.existsSync(backupdir)) {
      fs.mkdirSync(backupdir, {recursive: true});
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const destinationPath = safePath(backupdir, `${gameType}-Backup-${timestamp}`)

      fs.cpSync(fullSourcePath, destinationPath, {recursive: true})
      return {success: true, message: "Backup Has Been Created"}
    } catch (error) {
      console.error("Backup Failded:", error);
      return {success: false, message: "Failed To Create Backup"}
    }
  })
  ipcMain.handle('get-stats', async () => {
      let statusState = "404"
      let currentLatency = null;
      let isOnline = false;
      let playerCount = "0/0"

      if (serverAddress && typeof serverAddress === 'string' && serverAddress.trim() !== "") {
        const statusReady = await checkServerStatus(serverAddress);
        isOnline = statusReady.online;
        currentLatency = statusReady.latency

        if (isOnline) {
          statusState = "ONLINE";
          playerCount = `${statusReady.players}/${statusReady.maxplayers}`;
          if (!serverStartTime) {
            serverStartTime = Date.now();
          }
        } else {
          statusState = "OFFLINE"
          serverStartTime = null;
        }
      } else {
        statusState = "404"
        serverStartTime = null;
      }
      try {
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
        online: statusState,
        status: statusState,
        latency: currentLatency,
        players: playerCount
      };
    } catch (error) {
      return { cpu: "0%", memory: "0%", usedMemoryMB: 0, totalMemoryMB: 0, uptime: "00:00:00", online: "OFFLINE", status: "OFFLINE", latency: null, players: "0/0" };
    }
    });
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.yourname.servermanager');
  }
  createWindow();
}); 
