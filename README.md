# electron-shell

A thin Electron shell. It loads a hosted React app over HTTPS in production
("remote" mode) and can optionally load a locally bundled build instead
("local" mode) — see `.env.example`.

Build stack: [electron-vite](https://electron-vite.org) (dev/build) +
[electron-builder](https://www.electron.build) (package/sign/publish) +
[electron-updater](https://www.electron.build/auto-update) (auto-update
client). Electron ^43, TypeScript 7 (native Go compiler), Node 22 LTS recommended.

## Structure

```
src/
  main/                 Node process — full OS access, owns every window
    index.ts            entry point: app lifecycle, wires everything together
    window.ts           BrowserWindow creation, local/remote load logic, nav security
    config.ts            reads APP_LOAD_MODE / APP_REMOTE_URL / APP_ALLOWED_ORIGINS
    updater.ts           electron-updater wiring, forwards status to renderer
    menu.ts               native app menu
    ipc/
      index.ts            registerAllIpcHandlers() — the one place that wires up every handler
      print.handler.ts     ipcMain.handle(PRINT_EXECUTE, ...)
      printers.handler.ts  ipcMain.handle(PRINT_GET_PRINTERS, ...)
      app-info.handler.ts  ipcMain.handle(APP_GET_VERSION / APP_GET_PLATFORM, ...)
      update.handler.ts    ipcMain.handle(UPDATE_CHECK, ...)

  preload/               Runs in an isolated world inside the renderer process
    index.ts              the ONLY file that calls contextBridge.exposeInMainWorld
    api/
      print.api.ts         ipcRenderer.invoke wrappers for the print domain
      app-info.api.ts       resolves appVersion/platform once at startup
      update.api.ts         checkForUpdates() + onUpdateStatus() push-event subscription

  shared/                Zero-dependency files safe to copy-paste into the React repo
    ipc-channels.ts        single source of truth for every channel name string
    electron-api.d.ts      the window.electronAPI type contract

  renderer/               The SHELL's own minimal pages only — never the real app UI
    loading.html            shown briefly on startup
    offline.html             shown if the remote URL fails to load

resources/web-app/       Drop a built React app here for "local" mode (git-ignored)
electron-builder.yml     packaging / signing / publish config
electron.vite.config.ts  build config for main, preload, and renderer
```

## Adding a new IPC feature

Always the same three steps, and they keep main/preload in lockstep:

1. Add the channel name(s) to `src/shared/ipc-channels.ts`
2. Create `src/main/ipc/<feature>.handler.ts` exporting `register<Feature>Handler()`, call it from `src/main/ipc/index.ts`
3. Create `src/preload/api/<feature>.api.ts` exporting the exposed slice, spread it into `electronAPI` in `src/preload/index.ts`, and add the field to `ElectronAPI` in `src/shared/electron-api.d.ts`

## Local vs. remote mode

Controlled entirely by env vars read in `src/main/config.ts` — no code change needed to switch:

```bash
# production default
APP_LOAD_MODE=remote APP_REMOTE_URL=https://app.example.com npm run start

# load a locally bundled build instead (drop it in resources/web-app/ first)
APP_LOAD_MODE=local npm run start
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | electron-vite dev server with HMR for main/preload, launches Electron |
| `npm run build` | production build of main/preload/renderer to `out/` |
| `npm run typecheck` | `tsc --noEmit` across the whole project |
| `npm run dist` | build + electron-builder package for the current OS |
| `npm run dist:mac` / `dist:win` / `dist:linux` | build + package for a specific OS |
| `npm run dist:publish` | build + package + publish update artifacts to the configured feed |

## Before shipping to real users

- **macOS**: get a Developer ID Application certificate, set `APPLE_ID` /
  `APPLE_APP_SPECIFIC_PASSWORD` (or `APPLE_API_KEY`), uncomment `notarize:
  true` in `electron-builder.yml`. Unnotarized builds won't auto-update
  cleanly.
- **Windows**: SmartScreen trust now requires an EV certificate with a
  hardware-backed private key (CA/B Forum mandate since June 2023) — a cloud
  HSM signing service (Azure Trusted Signing, SSL.com, DigiCert KeyLocker)
  is the practical way to do this in CI.
- **Update feed**: `electron-builder.yml`'s `publish` block points at a
  generic HTTPS feed by default — point it at wherever you'll host
  `latest.yml` / `latest-mac.yml` / `latest-linux.yml` and the installers
  (S3, your own server, or GitHub Releases via a separate public repo if you
  want the free `update.electronjs.org` route).
- Copy `src/shared/electron-api.d.ts` into the React repo whenever it
  changes — see the comment at the top of that file.
