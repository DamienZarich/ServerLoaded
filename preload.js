const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    getStats: () => ipcRenderer.invoke('get-stats'),
    sendCommand: (cmd) =>ipcRenderer.invoke('send-rcon', cmd)
});