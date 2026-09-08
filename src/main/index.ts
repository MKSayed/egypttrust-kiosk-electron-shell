import { app } from 'electron';
import { registerAllIpcHandlers } from './ipc';
// import { initAutoUpdater } from './updater';
import { createMainWindow } from './window';
import { startWorker } from './worker';

// Only one instance of the app should run at a time.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  startWorker();
}

app.whenReady().then(() => {
  registerAllIpcHandlers();
  // buildAppMenu();

  createMainWindow();
  // const mainWindow = createMainWindow();
  // initAutoUpdater(mainWindow);

});

