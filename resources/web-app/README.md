# Local mode content

Drop the **built** output of the React repo here for local mode
(`APP_LOAD_MODE=local`) — i.e. whatever `vite build` produces in that
repo's `dist/` folder: `index.html`, plus its JS/CSS/asset files, copied
as-is into this folder.

This directory is git-ignored (see the root `.gitignore`) other than this
README — you (or CI) copy the built React app in as a build step, it's not
meant to be committed to this repo.

In `local` mode, `src/main/window.ts` calls `win.loadFile()` on
`resources/web-app/index.html` directly, so relative asset paths in that
`index.html` must resolve correctly when loaded via `file://` — Vite's
default relative-base build output works for this out of the box.
