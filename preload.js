const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
    getStats: () => ipcRenderer.invoke('get-stats'),
    sendCommand: (cmd) =>ipcRenderer.invoke('send-rcon', cmd),
    StartServer: (selectedPath, ipAddress) => ipcRenderer.invoke('start-server', selectedPath, ipAddress),
    ResetServer: () => ipcRenderer.invoke('ResetServer'),
    getSavedPath: () => ipcRenderer.invoke('get-saved-path'),
    saveServerAddress: (folderPath, ipAddress) => ipcRenderer.invoke('save-server-address', folderPath, ipAddress),
    getIpForPath: (folderPath) => ipcRenderer.invoke('get-ip-for-path', folderPath),
    configFiles: (folderPath) => ipcRenderer.invoke('open-config-channel', folderPath),
    serverFiles: (folderPath) => ipcRenderer.invoke('open-folder-channel', folderPath),
    createServerBackup: () => ipcRenderer.invoke('create-server-backup'),
    minWindow: () => ipcRenderer.send('window-min'),
    maxWindow: () => ipcRenderer.send('window-max'),
    closeWindow: () => ipcRenderer.send('window-close')
}); 