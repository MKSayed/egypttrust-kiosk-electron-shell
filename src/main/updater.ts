import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { IpcChannels } from '../shared/ipc-channels';

/**
 * electron-updater reads update metadata (latest.yml / latest-mac.yml) from
 * whatever "publish" provider is configured in electron-builder.yml (a
 * generic HTTP feed, S3, or GitHub Releases). Nothing else in this file
 * needs to change if you switch providers later.
 */
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (status: UpdateStatus) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IpcChannels.UPDATE_STATUS, status);
    }
  };

  autoUpdater.on('checking-for-update', () => send({ status: 'checking' }));
  autoUpdater.on('update-available', (info) => send({ status: 'available', version: info.version }));
  autoUpdater.on('update-not-available', () => send({ status: 'not-available' }));
  autoUpdater.on('download-progress', () => send({ status: 'downloading' }));
  autoUpdater.on('update-downloaded', (info) => send({ status: 'downloaded', version: info.version }));
  autoUpdater.on('error', (err) => send({ status: 'error', error: err.message }));

  // Check once on startup. checkForUpdatesAndNotify() also works if you want
  // the native OS notification; checkForUpdates() alone gives you full
  // control via the events above, which is usually the better fit since you
  // likely want your own in-app "restart to update" UI.
  void autoUpdater.checkForUpdates();
}

export function checkForUpdates(): Promise<unknown> {
  return autoUpdater.checkForUpdates();
}
