import type { ActionResult, CheckXLimitsPayload } from '../../shared/ipc.js';

/**
 * Mock X API rate limit lookup. Real call:
 *   GET https://api.x.com/2/usage/tweets
 *   Authorization: Bearer ${token}
 */
export async function checkXLimits(
  payload: CheckXLimitsPayload,
): Promise<
  ActionResult<{
    remaining: number;
    limit: number;
    resetAt: string;
  }>
> {
  await new Promise((r) => setTimeout(r, 250));

  // Mocked envelope — only swap when a real token is configured.
  if (!payload.token) {
    return {
      ok: true,
      message: 'X API limits (mocked — no token configured).',
      data: {
        remaining: 287,
        limit: 300,
        resetAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      },
      at: new Date().toISOString(),
    };
  }

  // Token path stays unimplemented to avoid embedding network secrets in OSS.
  return {
    ok: false,
    message: 'Live X API integration not yet wired in this scaffold.',
    at: new Date().toISOString(),
  };
}
