import { spawn } from 'node:child_process';
import type { ActionResult, VercelDeployPayload } from '../../shared/ipc.js';

/**
 * Stub for `vercel deploy [--prod]`. We capture stdout/stderr and
 * return them so the renderer can surface live build output.
 *
 * In an end-user install this would stream chunks back over IPC;
 * the scaffold here returns a one-shot result for brevity.
 */
export async function runVercelDeploy(
  payload: VercelDeployPayload,
): Promise<ActionResult<{ stdout: string; stderr: string }>> {
  const args = ['deploy'];
  if (payload.env === 'production') args.push('--prod');

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const child = spawn('vercel', args, {
      shell: process.platform === 'win32',
      cwd: process.cwd(),
    });

    child.stdout?.on('data', (b) => (stdout += b.toString()));
    child.stderr?.on('data', (b) => (stderr += b.toString()));

    child.on('error', (err) => {
      resolve({
        ok: false,
        message: `Vercel CLI not available: ${err.message}`,
        data: { stdout, stderr },
        at: new Date().toISOString(),
      });
    });

    child.on('close', (code) => {
      resolve({
        ok: code === 0,
        message:
          code === 0
            ? `Deployed ${payload.project} (${payload.env}).`
            : `Vercel CLI exited with code ${code}.`,
        data: { stdout, stderr },
        at: new Date().toISOString(),
      });
    });
  });
}
