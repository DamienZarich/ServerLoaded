const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
    getStats: () => ipcRenderer.invoke('get-stats'),
    sendCommand: (cmd) =>ipcRenderer.invoke('send-rcon', cmd),
    StartServer: (selectedPath, ipAddress) => ipcRenderer.invoke('start-server', selectedPath, ipAddress),
    ResetServer: () => ipcRenderer.invoke('reset'),
    getSavedPath: () => ipcRenderer.invoke('get-saved-path')
}); 