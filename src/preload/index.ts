import { contextBridge } from 'electron';
import { resolveAppInfo } from './api/app-info.api';
import { resolveSettings } from './api/config.api';
import { printApi } from './api/print.api';
import { updateApi } from './api/update.api';

// This is the ONLY file allowed to call contextBridge.exposeInMainWorld.
// Everything it publishes comes from the api/ slices, which stay in sync
// 1:1 with src/main/ipc/*.handler.ts and with the ElectronAPI interface in
// src/shared/electron-api.d.ts. If a field exists on `window.electronAPI`
// in the React app but isn't assembled here, that's a bug in this file.
async function exposeElectronApi(): Promise<void> {
  const [{ appVersion, platform }, settings] = await Promise.all([
    resolveAppInfo(),
    resolveSettings(),
  ]);

  const electronAPI: ElectronAPI = {
    isElectron: true,
    appVersion,
    platform,
    settings,
    ...printApi,
    ...updateApi,
  };

  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
}

void exposeElectronApi();
