// electron-api.d.ts
// -----------------------------------------------------------------------
// The contract between the preload script (src/preload) and any page that
// loads inside this shell — including the separately-hosted React app.
//
// This file has ZERO imports and ZERO dependencies on the rest of this
// project on purpose: that's what makes it safe to copy-paste verbatim
// into the React repo (e.g. src/types/electron-api.d.ts) without adjusting
// anything. If you add a field here, update src/preload/api accordingly,
// then re-copy this file into the React repo.
//
// Last synced into the React repo: <fill in the date when you copy this>
// -----------------------------------------------------------------------

export {};

declare global {
  interface ElectronPrintOptions {
    silent?: boolean;
    printerName?: string;
    // leave `printerName` unset when calling print() to use the OS default.
    copies?: number;
    landscape?: boolean;
  }

  interface PrinterInfo {
    name: string;
    displayName: string;
    // No cross-platform isDefault flag is available from Electron's API —
  }

  interface PrintResult {
    success: boolean;
    error?: string;
  }

  interface PrintPdfRequest {
    base64PDFDocument: string;
    options?: ElectronPrintOptions;
  }

  interface UpdateStatus {
    status:
      | "checking"
      | "available"
      | "not-available"
      | "downloading"
      | "downloaded"
      | "error";
    version?: string;
    error?: string;
  }

  interface ElectronAPI {
    /** Always true when running inside this shell. Use for feature detection. */
    isElectron: true;
    platform: "win32" | "darwin" | "linux";
    appVersion: string;

    print: (options?: ElectronPrintOptions) => Promise<PrintResult>;

    printPdfString: (request: PrintPdfRequest) => Promise<PrintResult>;

    getPrinters: () => Promise<PrinterInfo[]>;

    checkForUpdates: () => Promise<void>;
    /** Subscribe to update lifecycle events. Returns an unsubscribe function. */
    onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
  }

  interface Window {
    /** Undefined in a plain browser tab — always guard with `window.electronAPI?.` */
    electron?: ElectronAPI;
  }
}
