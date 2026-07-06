const { app, BrowserWindow, ipcMain, dialog } = require('electron');
ipcMain.handle('open-folder-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled) return null;
  store.set('lastServerPath', filePaths[0]);
  return filePaths[0];
})
const path = require('path');
const os = require('os');
const si = require('systeminformation');
const Store = require('electron-store');
const store = new Store.default()
const savedPath = store.get('lastServerPath')

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
      return {
        cpu: Math.round(cpu.currentLoad) +"%",
        memory: memPercent + "%",
        usedMemoryMB: usedMemMB,
        totalMemoryMB: totalMemMB
      }
      return store.get('lastServerPath') || "";
    });
app.whenReady().then(createWindow); 