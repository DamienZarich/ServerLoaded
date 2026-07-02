const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs')

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

  win.loadFile('index.html');
}
ipcMain.handle('get-stats', async () => {
  return {cpu: "10%", memory: "50%"}
});
app.whenReady().then(createWindow);