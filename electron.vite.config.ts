import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';

// electron-vite builds three independent bundles from one config:
//   main      -> out/main/index.js       (Node process, full OS access)
//   preload   -> out/preload/index.js    (the bridge script, see src/preload)
//   renderer  -> out/renderer/*.html     (ONLY the shell's own splash/offline
//                                          pages — never the real app UI,
//                                          that's the separately hosted React repo)
export default defineConfig({
  main: {
    build: {
      externalizeDeps: true,
      outDir: 'out/main',
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') },
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: true,
      outDir: 'out/preload',
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') },
      },
    },
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          loading: resolve(__dirname, 'src/renderer/loading.html'),
          offline: resolve(__dirname, 'src/renderer/offline.html'),
        },
      },
    },
  },
});
