const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectSolutionFile: () => ipcRenderer.invoke('select-solution-file'),
  selectJsonFile: () => ipcRenderer.invoke('select-json-file'),
  runPacCommand: (solutionPath, customFileName) => ipcRenderer.invoke('run-pac-command', solutionPath, customFileName),
  readSettingsFile: (filePath) => ipcRenderer.invoke('read-settings-file', filePath),
  saveSettingsFile: (filePath, settings) => ipcRenderer.invoke('save-settings-file', filePath, settings)
});