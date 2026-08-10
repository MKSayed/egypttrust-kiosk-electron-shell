import { ipcRenderer } from 'electron';
import { IpcChannels } from '../../shared/ipc-channels';

// appVersion/platform are resolved once, synchronously, before contextBridge
// exposes them — see preload/index.ts. They don't need to be async getters
// since they can't change during the app's lifetime.
export async function resolveAppInfo() {
  const [appVersion, platform] = await Promise.all([
    ipcRenderer.invoke(IpcChannels.APP_GET_VERSION) as Promise<string>,
    ipcRenderer.invoke(IpcChannels.APP_GET_PLATFORM) as Promise<'win32' | 'darwin' | 'linux'>,
  ]);
  return { appVersion, platform };
}
