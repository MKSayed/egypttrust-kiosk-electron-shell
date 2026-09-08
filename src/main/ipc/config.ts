import { ipcMain } from "electron";
import { config } from "dotenv";
import { IpcChannels } from "../../shared/ipc-channels";

export const settings =
  config({ path: ".env.worker", quiet: true }).parsed ?? {};
export function registerConfigHandler(): void {
  ipcMain.handle(IpcChannels.CONFIG_GET_SETTINGS, () => ({
    ...settings,
    invert_face_cam: settings.invert_face_cam?.toLowerCase() === "true",
    receipt_printer_name:
      settings.receipt_printer_name.toLocaleLowerCase() === "null"
        ? undefined
        : settings.receipt_printer_name,
  }));
}
