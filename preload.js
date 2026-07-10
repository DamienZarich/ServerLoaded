const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
    getStats: () => ipcRenderer.invoke('get-stats'),
    sendCommand: (cmd) =>ipcRenderer.invoke('send-rcon', cmd),
    StartServer: (serverPath) => ipcRenderer.invoke('start-server', serverPath),
    ResetServer: () => ipcRenderer.invoke('reset'),
    getSavedPath: () => ipcRenderer.invoke('get-saved-path')
}); 