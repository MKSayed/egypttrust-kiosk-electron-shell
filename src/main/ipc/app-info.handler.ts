import { app, ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc-channels';

export function registerAppInfoHandler(): void {
  ipcMain.handle(IpcChannels.APP_GET_VERSION, () => app.getVersion());
  ipcMain.handle(IpcChannels.APP_GET_PLATFORM, () => process.platform);
}
