import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import type { ActionResult, OpenVSCodePayload } from '../../shared/ipc.js';

/**
 * Spawn the `code` CLI to open a project. Falls back to a best-guess
 * default path under ~/Projects/<name>. Non-blocking; we don't wait
 * for the editor to exit.
 */
export async function openInVSCode(
  payload: OpenVSCodePayload,
): Promise<ActionResult<{ resolvedPath: string }>> {
  const target =
    payload.path ?? path.join(homedir(), 'Projects', payload.projectName);

  if (!existsSync(target)) {
    return {
      ok: false,
      message: `Project not found at ${target}.`,
      at: new Date().toISOString(),
    };
  }

  try {
    const child = spawn('code', [target], {
      detached: true,
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });
    child.unref();

    return {
      ok: true,
      message: `VS Code opening "${payload.projectName}".`,
      data: { resolvedPath: target },
      at: new Date().toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: `Failed to launch VS Code: ${msg}`,
      at: new Date().toISOString(),
    };
  }
}
