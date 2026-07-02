const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const si = require('systeminformation');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      nodeIntegration: false
    }
  });
  ipcMain.handle('get-stats', async () => {
      const cpu = await si.currentLoad ();
      const mem = await si.mem ();

      return {
        cpu: Math.round(cpu.currentLoad) +"%",
        memory: Math.round((mem.active / mem.total) * 100) +"%"
      }
    });

  win.loadFile('index.html');
}
ipcMain.handle('get-stats', async () => {
  return {cpu: "10%", memory: "50%"}
});
app.whenReady().then(createWindow);