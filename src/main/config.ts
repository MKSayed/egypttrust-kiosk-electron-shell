import { join } from 'node:path';
import { app } from 'electron';

export type LoadMode = 'remote' | 'local';

export interface AppConfig {
  loadMode: LoadMode;
  /** Used when loadMode === 'remote'. */
  remoteUrl: string;
  /** Absolute path to the entry HTML file used when loadMode === 'local'. */
  localEntryPath: string;
  /** Origins the window is allowed to navigate to. Everything else is blocked. */
  allowedOrigins: string[];
}

/**
 * Central place that decides remote-vs-local. Backed by env vars so the
 * SAME built shell can be pointed at staging/production, or flipped to
 * local mode, without a code change:
 *
 *   APP_LOAD_MODE=remote APP_REMOTE_URL=https://app.example.com npm run start
 *   APP_LOAD_MODE=local  npm run start
 *
 * "Local" mode expects you to have dropped a built React app (index.html +
 * assets, i.e. the output of `vite build` from the React repo) into
 * resources/web-app/. See resources/web-app/README.md.
 */
export function loadConfig(): AppConfig {
  const loadMode: LoadMode = (import.meta.env as any).VITE_APP_LOAD_MODE === 'local' ? 'local' : 'remote';

  const remoteUrl = (import.meta.env as any).VITE_APP_REMOTE_URL ?? 'https://app.example.com';

  const localEntryPath = app.isPackaged
    ? join(process.resourcesPath, 'web-app', 'index.html')
    : join(app.getAppPath(), 'resources/web-app/index.html');

  const allowedOrigins = ((import.meta.env as any).VITE_APP_ALLOWED_ORIGINS as string ?? remoteUrl)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return { loadMode, remoteUrl, localEntryPath, allowedOrigins };
}
