import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BrowserWindow, net, protocol, shell } from 'electron';
import { loadConfig } from './config';

const isDev = !!process.env.ELECTRON_RENDERER_URL; // set by electron-vite in dev mode

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

export function createMainWindow(): BrowserWindow {
  const config = loadConfig();

  const win = new BrowserWindow({
    fullscreen: true,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // --- Security: this window may only ever navigate within the app's own
  // known origins. Anything else (an ad, a phishing redirect, a compromised
  // link inside the loaded page) opens in the OS browser instead, or is
  // blocked outright. This matters precisely because we load remote content.
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url, config.allowedOrigins)) {
      event.preventDefault();
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigation(url, config.allowedOrigins)) {
      return { action: 'allow' };
    }
    shell.openExternal(url); // e.g. a "help" link opens in the user's real browser
    return { action: 'deny' };
  });

  void loadApp(win, config);

  return win;
}

async function loadApp(
  win: BrowserWindow,
  config: ReturnType<typeof loadConfig>,
): Promise<void> {
  const offlinePage = isDev
    ? `${process.env.ELECTRON_RENDERER_URL}/offline.html`
    : join(__dirname, '../renderer/offline.html');

  if (config.loadMode === 'local') {
    const appRoot = dirname(config.localEntryPath);

    protocol.handle('app', (request) => {
      const filePath = join(appRoot, decodeURIComponent(new URL(request.url).pathname));
      return net.fetch(pathToFileURL(filePath).toString());
    });

    await win.loadURL('app://local/index.html');
    return;
  }

  try {
    await win.loadURL(config.remoteUrl);
  } catch {
    if (isDev) {
      await win.loadURL(offlinePage);
    } else {
      await win.loadFile(offlinePage);
    }
  }
}

function isAllowedNavigation(url: string, allowedOrigins: string[]): boolean {
  try {
    const target = new URL(url);
    return allowedOrigins.some((origin) => target.origin === new URL(origin).origin);
  } catch {
    return false;
  }
}
