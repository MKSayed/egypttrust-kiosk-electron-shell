import { app, BrowserWindow, ipcMain } from "electron";
import Handlebars from "handlebars";
import type { EventEmitter } from "node:events";
import { mkdtemp, readFile, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { IpcChannels } from "../../shared/ipc-channels";

const PDF_READY_TIMEOUT_MS = 30_000;

function decodePdf(base64PDFDocument: string): Buffer {
  const pdf = Buffer.from(base64PDFDocument, "base64");
  if (pdf.length === 0 || !pdf.subarray(0, 1024).includes("%PDF-")) {
    throw new Error("The decoded document is not a PDF file");
  }

  return pdf;
}

function printWindowContents(
  win: BrowserWindow,
  options: ElectronPrintOptions,
): Promise<PrintResult> {
  const printOptions: Electron.WebContentsPrintOptions = {
    silent: options.silent ?? true,
    copies: options.copies ?? 1,
    landscape: options.landscape ?? false,
  };

  const printerName = options.printerName?.trim();
  if (printerName) {
    printOptions.deviceName = printerName;
  }

  return new Promise((resolve) => {
    win.webContents.print(printOptions, (success, failureReason) => {
      resolve(
        success
          ? { success: true }
          : { success: false, error: failureReason },
      );
    });
  });
}

async function printHiddenContents(
  load: (win: BrowserWindow) => Promise<unknown>,
  options: ElectronPrintOptions = {},
  plugins = false,
): Promise<PrintResult> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { plugins, backgroundThrottling: false },
  });

  try {
    await load(win);
    return await printWindowContents(win, options);
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

function printFailure(error: unknown): PrintResult {
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

async function renderReceipt(receiptData: ReceiptData): Promise<string> {
  if (!receiptData?.paymentInformation?.data || !receiptData.posPayment) {
    throw new Error("Receipt data is required");
  }

  const payment = receiptData.paymentInformation.data;
  const pos = receiptData.posPayment;
  const templatePath = app.isPackaged
    ? join(process.resourcesPath, "receipt", "egtrust-receipt.html")
    : join(app.getAppPath(), "resources", "resources", "receipt", "egtrust-receipt.html");
  const template = Handlebars.compile(await readFile(templatePath, "utf8"));

  return template({
    requestId: payment.requestId,
    paymentReference: payment.paymentReference,
    transactionAmount: pos.transactionAmount,
    cardNumber: pos.cardNumber ?? "",
    terminalId: pos.terminalId ?? "",
    merchantId: pos.merchantId ?? "",
    ecrRefNo: pos.ecrRefNo ?? "",
    trxDatetime: pos.trxDatetime ?? "",
    trxRrn: pos.trxRrn ?? "",
    rspCode: pos.rspCode ?? "",
    authCode: pos.authCode ?? "",
    batch: pos.batch ?? "",
  });
}

function waitForPdfReady(win: BrowserWindow): Promise<void> {
  const { webContents } = win;
  const pdfEvents = webContents as EventEmitter;

  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timeout);
      pdfEvents.removeListener("-pdf-ready-to-print", onReady);
      webContents.removeListener("destroyed", onDestroyed);
    };

    const onReady = (): void => {
      cleanup();
      resolve();
    };

    const onDestroyed = (): void => {
      cleanup();
      reject(new Error("The PDF print window was closed before it was ready"));
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for the PDF document to load"));
    }, PDF_READY_TIMEOUT_MS);

    // Electron emits this internal event when PDFium has finished loading the
    // document and the PDF plugin is ready to service a print request.
    pdfEvents.once("-pdf-ready-to-print", onReady);
    webContents.once("destroyed", onDestroyed);
  });
}

/**
 * One file per IPC "feature." This one owns everything print-related:
 * the handler AND (implicitly) the webContents.print call. If printing
 * logic ever grows (print-to-PDF, a hidden print window, etc.) it grows
 * inside this file, not inside main/index.ts.
 */
export function registerPrintHandler(): void {
  ipcMain.handle(
    IpcChannels.PRINT_CURRENT_WINDOW,
    async (event, options: ElectronPrintOptions = {}): Promise<PrintResult> => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return { success: false, error: "No window for this request" };

      return printWindowContents(win, {
        ...options,
        silent: options.silent ?? false,
      });
    },
  );


  ipcMain.handle(
    IpcChannels.PRINT_B64_PDF,
    async (
      _event,
      request: PrintPdfRequest,
    ): Promise<PrintResult> => {
      let temporaryDirectory: string | undefined;
      let pdfPath: string | undefined;

      try {
        if (!request || typeof request !== "object") {
          throw new Error("A PDF print request is required");
        }

        const { base64PDFDocument, options = {} } = request;
        const pdf = decodePdf(base64PDFDocument);

        temporaryDirectory = await mkdtemp(join(tmpdir(), "cso-pdf-print-"));
        pdfPath = join(temporaryDirectory, "document.pdf");
        await writeFile(pdfPath, pdf);

        return await printHiddenContents(async (win) => {
          // Register before navigation: the readiness event can fire quickly.
          const pdfReady = waitForPdfReady(win);
          await Promise.all([win.loadFile(pdfPath!), pdfReady]);
        }, options, true);
      } catch (error) {
        return printFailure(error);
      } finally {
        if (pdfPath) {
          await unlink(pdfPath).catch(() => undefined);
        }
        if (temporaryDirectory) {
          await rmdir(temporaryDirectory).catch(() => undefined);
        }
      }
    },
  );

  ipcMain.handle(
    IpcChannels.PRINT_RECEIPT,
    async (
      _event,
      receiptData: ReceiptData,
      options: ElectronPrintOptions = {},
    ): Promise<PrintResult> => {
      try {
        const html = await renderReceipt(receiptData);
        return await printHiddenContents(async (win) => {
          await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
          await win.webContents.executeJavaScript("document.fonts.ready");
        }, options);
      } catch (error) {
        return printFailure(error);
      }
    },
  );


  ipcMain.handle(
    IpcChannels.PRINT_GET_PRINTERS,
    async (event): Promise<PrinterInfo[]> => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return [];

      // Note: Electron's PrinterInfo has no cross-platform isDefault flag —
      // leave deviceName unset in print() to use the OS default printer,
      // rather than trying to guess which entry here is the default.
      const printers = await win.webContents.getPrintersAsync();
      return printers.map((printer) => ({
        name: printer.name,
        displayName: printer.displayName,
      }));
    },
  );
}
