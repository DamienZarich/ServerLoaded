const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
    getStats: () => ipcRenderer.invoke('get-stats'),
    sendCommand: (cmd) =>ipcRenderer.invoke('send-rcon', cmd),
    startServer: (serverPath) => ipcRenderer.invoke('start-server', serverPath)
});