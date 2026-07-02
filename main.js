const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { sign } = require('crypto');

let mainWindow
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
      const cpu = await sign.currentLoad ();
      const mem = await sign.mem ();

      return {
        
      }
    });

  win.loadFile('index.html');
}
ipcMain.handle('get-stats', async () => {
  return {cpu: "10%", memory: "50%"}
});
app.whenReady().then(createWindow);