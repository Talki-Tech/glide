import type { ActionResult, TweetPayload } from '../../shared/ipc.js';

/**
 * Draft (not post) a tweet. Real implementation would hit the X v2 API
 * `POST /2/tweets`. We mock the network call so the open-source repo
 * stays runnable without credentials.
 */
export async function draftTweet(
  payload: TweetPayload,
): Promise<ActionResult<{ draftId: string; preview: string }>> {
  const trimmed = payload.text.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: 'Tweet body is empty.',
      at: new Date().toISOString(),
    };
  }
  if (trimmed.length > 280) {
    return {
      ok: false,
      message: `Tweet too long (${trimmed.length}/280).`,
      at: new Date().toISOString(),
    };
  }

  // Simulate a network round-trip so motion in the UI feels real.
  await new Promise((r) => setTimeout(r, 350));

  const draftId = `draft_${Date.now().toString(36)}`;
  const preview = `${payload.handle}: ${trimmed}`;

  return {
    ok: true,
    message: `Draft queued for ${payload.handle}.`,
    data: { draftId, preview },
    at: new Date().toISOString(),
  };
}
