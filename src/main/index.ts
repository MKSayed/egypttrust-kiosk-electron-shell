import { app, BrowserWindow } from 'electron';
import { registerAllIpcHandlers } from './ipc';
import { buildAppMenu } from './menu';
import { initAutoUpdater } from './updater';
import { createMainWindow } from './window';

// Only one instance of the app should run at a time.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.whenReady().then(() => {
  registerAllIpcHandlers();
  // buildAppMenu();

  const mainWindow = createMainWindow();
  // initAutoUpdater(mainWindow);

});

