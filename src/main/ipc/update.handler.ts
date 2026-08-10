import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc-channels';
import { checkForUpdates } from '../updater';

export function registerUpdateHandler(): void {
  ipcMain.handle(IpcChannels.UPDATE_CHECK, () => checkForUpdates());
  // Note: there's no handler for UPDATE_STATUS here — that channel only
  // flows main -> renderer (mainWindow.webContents.send in updater.ts).
  // ipcMain.handle is exclusively for renderer -> main request/response.
}
