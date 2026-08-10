import { ipcRenderer } from 'electron';
import { IpcChannels } from '../../shared/ipc-channels';

export const updateApi = {
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke(IpcChannels.UPDATE_CHECK),

  // Pattern for main -> renderer push events: wrap ipcRenderer.on/removeListener
  // so the page never touches ipcRenderer or the raw IpcRendererEvent directly,
  // and gets a normal unsubscribe function back instead of a listener to manage.
  onUpdateStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => callback(status);
    ipcRenderer.on(IpcChannels.UPDATE_STATUS, listener);
    return () => ipcRenderer.removeListener(IpcChannels.UPDATE_STATUS, listener);
  },
};
