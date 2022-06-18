const { app, BrowserWindow, desktopCapturer, ipcMain, dialog } = require('electron');
const { writeFile } = require('fs');
const path = require('path');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.openDevTools();

};

ipcMain.on('list', (event, arg) => {
  desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    event.sender.send('sources', sources)
  })
})

ipcMain.on('selected', (event, source) => {
  event.sender.send('SET_SOURCE', source.id)
})

ipcMain.on('save', async (event, arg) =>{
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  });
  if (filePath) writeFile(filePath, arg, () => console.log('video saved successfully!'));
})

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});