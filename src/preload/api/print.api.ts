import { ipcRenderer } from 'electron';
import { IpcChannels } from '../../shared/ipc-channels';

/**
 * One file per IPC feature, mirroring src/main/ipc/*.handler.ts. Each file
 * exports a plain object slice; preload/index.ts merges all the slices into
 * the one object published via contextBridge.
 */
export const printApi = {
  print: (options?: ElectronPrintOptions): Promise<PrintResult> =>
    ipcRenderer.invoke(IpcChannels.PRINT_CURRENT_WINDOW, options),

  printPdfString: ({
    base64PDFDocument,
    options,
  }: PrintPdfRequest): Promise<PrintResult> =>
    ipcRenderer.invoke(IpcChannels.PRINT_B64_PDF, {
      base64PDFDocument,
      options,
    }),

  print_receipt: (
    receiptData: ReceiptData,
    options?: ElectronPrintOptions,
  ): Promise<PrintResult> =>
    ipcRenderer.invoke(IpcChannels.PRINT_RECEIPT, receiptData, options),

  getPrinters: (): Promise<PrinterInfo[]> => ipcRenderer.invoke(IpcChannels.PRINT_GET_PRINTERS),
};
