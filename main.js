const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.ico'),
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

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

// IPC handlers
ipcMain.handle('select-solution-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Solution Files', extensions: ['zip'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-json-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Settings Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('run-pac-command', async (event, solutionPath, customFileName) => {
  return new Promise((resolve, reject) => {
    const settingsFileName = customFileName && customFileName.endsWith('.json') ? customFileName : `${customFileName}.json`;
    const settingsFile = `.\\${settingsFileName}`;
    
    const command = `pac solution create-settings --solution-zip "${solutionPath}" --settings-file "${settingsFile}"`;
    
    const powershell = spawn('powershell.exe', ['-Command', command], {
      cwd: path.dirname(solutionPath)
    });

    let output = '';
    let error = '';

    powershell.stdout.on('data', (data) => {
      output += data.toString();
    });

    powershell.stderr.on('data', (data) => {
      error += data.toString();
    });

    powershell.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output, settingsFile: path.join(path.dirname(solutionPath), settingsFileName) });
      } else {
        reject({ success: false, error: error || output });
      }
    });
  });
});

ipcMain.handle('read-settings-file', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to read settings file: ${error.message}`);
  }
});

ipcMain.handle('save-settings-file', async (event, filePath, settings) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to save settings file: ${error.message}`);
  }
});