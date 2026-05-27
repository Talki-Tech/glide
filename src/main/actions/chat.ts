import type { ChatRequest, ChatResponse } from '../../shared/ipc.js';

/**
 * Local echo "AI" so the chat surface works out of the box.
 * Swap with an Anthropic / OpenAI / local llm.cpp call when ready.
 */
export async function runChat(req: ChatRequest): Promise<ChatResponse> {
  const last = req.messages.at(-1);
  await new Promise((r) => setTimeout(r, 450));

  const reply = last?.content
    ? `I heard: "${last.content}". (Wire a real LLM in src/main/actions/chat.ts.)`
    : 'How can I help?';

  return {
    reply: { role: 'assistant', content: reply },
  };
}
