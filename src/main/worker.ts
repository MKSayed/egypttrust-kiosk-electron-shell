import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { app } from 'electron';
import treeKill from 'tree-kill';

export function startWorker(): void {
  const cwd = process.cwd();
  const worker = spawn(join(cwd, 'worker.exe'), { cwd, stdio: 'ignore' });
  let pid = worker.pid;

  worker.once('exit', () => (pid = undefined));
  worker.once('error', () => (pid = undefined));

  app.once('before-quit', (event) => {
    if (!pid) return;

    event.preventDefault();
    treeKill(pid, 'SIGKILL', () => app.quit());
  });
}
