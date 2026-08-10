/**
 * Single source of truth for every IPC channel name in the app.
 *
 * Import this file from BOTH src/main/ipc/*.handler.ts (to register handlers)
 * and src/preload/api/*.ts (to call them). Never write a raw channel string
 * anywhere else — if you rename a channel here, TypeScript will flag every
 * call site that still uses the old name.
 *
 * Naming convention: "<domain>:<action>". Group by feature, not by
 * "renderer-to-main" vs "main-to-renderer" — that distinction lives in how
 * the channel is used (invoke/handle vs send/on), not in its name.
 */
export const IpcChannels = {
  // print domain
  PRINT_CURRENT_WINDOW: 'print:current-window',
  PRINT_B64_PDF: 'print:b64-pdf',
  PRINT_GET_PRINTERS: 'print:get-printers',

  // app-info domain
  APP_GET_VERSION: 'app:get-version',
  APP_GET_PLATFORM: 'app:get-platform',

  // update domain
  UPDATE_CHECK: 'update:check',
  UPDATE_STATUS: 'update:status', // main -> renderer push (autoUpdater events)
} as const;

export type IpcChannelName = (typeof IpcChannels)[keyof typeof IpcChannels];
