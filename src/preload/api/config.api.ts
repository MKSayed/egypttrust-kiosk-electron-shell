import { ipcRenderer } from 'electron';
import { IpcChannels } from '../../shared/ipc-channels';

export const resolveSettings = (): Promise<ElectronSettings> =>
  ipcRenderer.invoke(IpcChannels.CONFIG_GET_SETTINGS);
