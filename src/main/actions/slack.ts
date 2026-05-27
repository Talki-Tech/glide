import type { ActionResult, SyncGithubPRsPayload } from '../../shared/ipc.js';

/**
 * Mock GitHub PR → Slack sync. A real implementation would:
 *   1. GET /repos/{owner}/{repo}/pulls?state=open via Octokit
 *   2. Format a Slack blocks payload
 *   3. POST to a Slack incoming webhook
 *
 * We mock so the OSS repo runs without any tokens.
 */
export async function syncGithubPRs(
  payload: SyncGithubPRsPayload,
): Promise<ActionResult<{ prCount: number; channel: string }>> {
  await new Promise((r) => setTimeout(r, 500));

  // Fake but plausible PR list
  const fakePrCount = Math.floor(Math.random() * 8) + 1;

  return {
    ok: true,
    message: `Synced ${fakePrCount} open PRs from ${payload.repo} → ${payload.slackChannel}.`,
    data: { prCount: fakePrCount, channel: payload.slackChannel },
    at: new Date().toISOString(),
  };
}
