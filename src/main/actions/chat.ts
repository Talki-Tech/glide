import { BrowserWindow } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { ChatRequest, ChatResponse, ChatMessage } from '../../shared/ipc.js';
import { IpcChannels } from '../../shared/ipc.js';
import { llmManager, type ToolDef } from '../llm/LlmManager.js';
import { mcpManager } from '../mcp/McpManager.js';
import { LLM_MODELS, type LlmProvider } from '../../shared/llm.js';

/* ------------------------------------------------------------------ */
/* History persistence                                                 */
/* ------------------------------------------------------------------ */

const HISTORY_PATH = path.join(os.homedir(), '.glide', 'chat-history.json');

function loadHistory(): ChatMessage[] {
  try {
    if (!fs.existsSync(HISTORY_PATH)) return [];
    const raw = fs.readFileSync(HISTORY_PATH, 'utf-8');
    const arr = JSON.parse(raw) as ChatMessage[];
    // Keep last 200 messages to avoid token bloat
    return arr.slice(-200);
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]): void {
  try {
    const dir = path.dirname(HISTORY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Persist last 200 only
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(messages.slice(-200), null, 2), 'utf-8');
  } catch { /* ignore */ }
}

export function clearHistory(): void {
  try { fs.writeFileSync(HISTORY_PATH, '[]', 'utf-8'); } catch { /* ignore */ }
}

export function getHistory(): ChatMessage[] {
  return loadHistory();
}

/* ------------------------------------------------------------------ */
/* System prompt                                                       */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(): string {
  const tools = mcpManager.listTools();
  const servers = mcpManager.listServers().filter((s) => s.status === 'connected');

  const toolList = tools.length > 0
    ? tools.map((t) => `- ${t.serverName}/${t.name}: ${t.description ?? 'no description'}`).join('\n')
    : '  (none connected)';

  const serverList = servers.length > 0
    ? servers.map((s) => `- ${s.name} (${s.toolCount} tools)`).join('\n')
    : '  (none connected)';

  return `You are Glide — a powerful AI assistant embedded in a developer command palette on Windows.
You have access to MCP (Model Context Protocol) tools that let you read/write files, search the web, query databases, interact with GitHub, Slack, and more.

## Connected MCP servers
${serverList}

## Available tools
${toolList}

## Guidelines
- Be concise. User is a developer. No fluff.
- When the user asks to do something that a tool can accomplish, USE the tool immediately.
- After tool results, continue the task — chain multiple tool calls if needed.
- Format code with markdown code blocks.
- If no tools are connected, explain what MCP servers would help.
- Current date: ${new Date().toISOString().slice(0, 10)}

## Glide UI commands
You can embed special interactive elements in your responses. Use them to make responses actionable:

**Badge** — highlight a status inline:
<glide:badge color="mint" text="Done">
<glide:badge color="amber" text="Warning">
<glide:badge color="red" text="Error">

**Progress bar** — show completion:
<glide:progress value=75 label="Building...">

**Card** — highlighted info block:
<glide:card title="Result" color="mint">Your message here</glide:card>
<glide:card title="Warning" color="amber">Something to watch out for</glide:card>

**Open settings button**:
<glide:open-settings tab="ai">

**Run palette command button**:
<glide:run-command id="vercel-deploy" label="Deploy to Vercel">

Use these sparingly — only when they genuinely improve clarity or make the response actionable.`;
}

/* ------------------------------------------------------------------ */
/* MCP tool definitions for LLM                                        */
/* ------------------------------------------------------------------ */

function getMcpToolDefs(): ToolDef[] {
  return mcpManager.listTools().map((t) => ({
    name: `${t.serverName}__${t.name}`, // flatten to valid identifier
    description: `[${t.serverName}] ${t.description ?? t.name}`,
    inputSchema: t.inputSchema,
  }));
}

/* ------------------------------------------------------------------ */
/* Push helpers                                                        */
/* ------------------------------------------------------------------ */

function broadcast(channel: string, payload: unknown): void {
  BrowserWindow.getAllWindows().forEach((w) => {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  });
}

/* ------------------------------------------------------------------ */
/* Main agentic chat handler                                           */
/* ------------------------------------------------------------------ */

const MAX_TOOL_ROUNDS = 8; // prevent infinite loops

export async function runChat(req: ChatRequest): Promise<ChatResponse> {
  const configs = llmManager.getConfigs();
  const providers: LlmProvider[] = ['anthropic', 'openai', 'gemini'];
  const provider = providers.find((p) => configs[p]?.apiKey);

  if (!provider) {
    const msg = 'No AI provider configured. Open Settings → AI Providers and add an API key.';
    broadcast(IpcChannels.ChatDone, { fullText: msg });
    return { reply: { role: 'assistant', content: msg } };
  }

  const cfg = configs[provider]!;
  const modelId = cfg.defaultModel ?? LLM_MODELS[provider][0].id;

  // Load persisted history + merge with incoming messages
  const history = loadHistory();

  // The request messages already contain the full session from renderer.
  // Use them directly (they include current user message) but prepend system.
  const sessionMessages = req.messages.filter((m) => m.role !== 'system');

  // Merge history with session: history is the "long-term" store,
  // session is what renderer tracked. Take session if it has more messages.
  const baseMessages: ChatMessage[] = sessionMessages.length >= history.length
    ? sessionMessages
    : history;

  // Add system prompt as first message
  const systemPrompt = buildSystemPrompt();
  const allMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...baseMessages,
  ];

  const toolDefs = getMcpToolDefs();
  let currentMessages = allMessages;
  let fullAssistantText = '';
  let round = 0;
  let doneBroadcast = false;
  // Track previous tool call signatures to detect infinite loops
  const seenToolCalls = new Set<string>();

  while (round < MAX_TOOL_ROUNDS) {
    round++;
    let roundText = '';

    let roundInputTokens: number | undefined;
    let roundOutputTokens: number | undefined;

    const { toolCalls } = await llmManager.chatStream(
      { provider, model: modelId, messages: currentMessages, maxTokens: 4096 },
      toolDefs,
      {
        onToken: (delta) => {
          roundText += delta;
          broadcast(IpcChannels.ChatToken, { delta });
        },
        onToolCall: (name, args) => {
          broadcast(IpcChannels.ChatToolCall, { toolName: name, args });
        },
        onDone: (text, inputTokens, outputTokens) => {
          fullAssistantText += text;
          roundInputTokens = inputTokens;
          roundOutputTokens = outputTokens;
          // Don't broadcast ChatDone here — we don't know yet if tool calls follow.
          // ChatDone is sent after the loop completes.
        },
        onError: (err) => {
          broadcast(IpcChannels.ChatError, { error: err });
        },
      },
    );

    if (toolCalls.length === 0) {
      // No tool calls — conversation complete, send final done event
      broadcast(IpcChannels.ChatDone, {
        fullText: fullAssistantText,
        inputTokens: roundInputTokens,
        outputTokens: roundOutputTokens,
      });
      doneBroadcast = true;
      break;
    }

    // Add assistant message with tool calls to history
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: roundText || '' },
    ];

    // Detect tool call loop — if all calls in this round were already seen, stop
    const roundSigs = toolCalls.map((tc) => `${tc.name}:${JSON.stringify(tc.args)}`);
    const allSeen = roundSigs.every((s) => seenToolCalls.has(s));
    if (allSeen) {
      broadcast(IpcChannels.ChatDone, { fullText: fullAssistantText });
      doneBroadcast = true;
      break;
    }
    roundSigs.forEach((s) => seenToolCalls.add(s));

    // Execute each tool call and append results
    for (const tc of toolCalls) {
      // tc.name is "serverName__toolName"
      const [serverName, ...toolParts] = tc.name.split('__');
      const toolName = toolParts.join('__');

      let resultText = '';
      try {
        const result = await mcpManager.callTool({
          serverId: serverName,
          toolName,
          args: tc.args,
        });

        if (result.ok) {
          resultText = result.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text ?? '')
            .join('\n') || '(tool returned no text)';
        } else {
          resultText = `Tool error: ${result.error ?? 'unknown'}`;
        }
      } catch (err) {
        resultText = `Tool execution failed: ${err instanceof Error ? err.message : String(err)}`;
      }

      // Broadcast tool result to renderer
      broadcast(IpcChannels.ChatToolCall, {
        toolName: tc.name,
        serverName,
        args: tc.args,
        result: resultText,
      });

      // Append tool result as user message (provider-agnostic approach)
      currentMessages = [
        ...currentMessages,
        {
          role: 'user',
          content: `[Tool result for ${tc.name}]:\n${resultText}`,
        },
      ];
    }
    // Continue loop — LLM will see tool results and respond
  }

  // Persist updated history (without system prompt)
  const persistable = currentMessages.filter((m) => m.role !== 'system');
  saveHistory(persistable);

  // Fire done event if loop ended due to max rounds (not already sent)
  if (!doneBroadcast) {
    broadcast(IpcChannels.ChatDone, { fullText: fullAssistantText });
  }

  return {
    reply: { role: 'assistant', content: fullAssistantText || '(no response)' },
  };
}
