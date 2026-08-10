import { registerAppInfoHandler } from './app-info.handler';
import { registerPrintHandler } from './print.handler';
import { registerUpdateHandler } from './update.handler';

/**
 * Adding a new IPC feature is always the same three steps:
 *   1. Add the channel name(s) to src/shared/ipc-channels.ts
 *   2. Create src/main/ipc/<feature>.handler.ts with a register<Feature>Handler()
 *   3. Call it here, and expose it from src/preload/api/<feature>.api.ts
 */
export function registerAllIpcHandlers(): void {
  registerPrintHandler();
  registerAppInfoHandler();
  registerUpdateHandler();
}
