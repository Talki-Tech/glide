import { ipcMain, BrowserWindow } from 'electron';
import {
  IpcChannels,
  type ChatRequest,
  type ChatResponse,
  type CheckXLimitsPayload,
  type OpenVSCodePayload,
  type SyncGithubPRsPayload,
  type TweetPayload,
  type VercelDeployPayload,
  type McpServerConfig,
  type McpCallToolPayload,
} from '../../shared/ipc.js';
import { draftTweet } from '../actions/tweet.js';
import { openInVSCode } from '../actions/vscode.js';
import { runVercelDeploy } from '../actions/vercel.js';
import { syncGithubPRs } from '../actions/slack.js';
import { checkXLimits } from '../actions/x.js';
import { runChat, getHistory, clearHistory } from '../actions/chat.js';
import { mcpManager } from '../mcp/McpManager.js';
import { llmManager } from '../llm/LlmManager.js';
import { saveConfigs, loadConfigs } from '../llm/keyStore.js';
import type { LlmChatPayload, LlmProviderConfigs } from '../../shared/llm.js';

function broadcastToAll(channel: string, payload: unknown): void {
  BrowserWindow.getAllWindows().forEach((w) => {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  });
}

export function registerIpcHandlers(): void {
  // Load persisted LLM keys on startup
  const savedConfigs = loadConfigs();
  if (Object.keys(savedConfigs).length > 0) {
    llmManager.setConfigs(savedConfigs);
  }

  /* ------------------------------------------------------------------ */
  /* Existing actions                                                     */
  /* ------------------------------------------------------------------ */

  ipcMain.handle(IpcChannels.ActionTweet, async (_evt, payload: TweetPayload) =>
    draftTweet(payload),
  );
  ipcMain.handle(IpcChannels.ActionOpenVSCode, async (_evt, payload: OpenVSCodePayload) =>
    openInVSCode(payload),
  );
  ipcMain.handle(IpcChannels.ActionVercelDeploy, async (_evt, payload: VercelDeployPayload) =>
    runVercelDeploy(payload),
  );
  ipcMain.handle(IpcChannels.ActionSyncGithubPRs, async (_evt, payload: SyncGithubPRsPayload) =>
    syncGithubPRs(payload),
  );
  ipcMain.handle(IpcChannels.ActionCheckXLimits, async (_evt, payload: CheckXLimitsPayload) =>
    checkXLimits(payload),
  );
  ipcMain.handle(
    IpcChannels.ChatSendMessage,
    async (_evt, payload: ChatRequest): Promise<ChatResponse> => runChat(payload),
  );

  /* ------------------------------------------------------------------ */
  /* MCP — query                                                          */
  /* ------------------------------------------------------------------ */

  ipcMain.handle(IpcChannels.McpListServers, () => mcpManager.listServers());

  ipcMain.handle(IpcChannels.McpListTools, () => mcpManager.listTools());

  ipcMain.handle(
    IpcChannels.McpCallTool,
    async (_evt, payload: McpCallToolPayload) => mcpManager.callTool(payload),
  );

  /* ------------------------------------------------------------------ */
  /* MCP — server management                                             */
  /* ------------------------------------------------------------------ */

  ipcMain.handle(IpcChannels.McpAddServer, async (_evt, config: McpServerConfig) => {
    await mcpManager.addServer(config);
    return { ok: true };
  });

  ipcMain.handle(IpcChannels.McpRemoveServer, async (_evt, name: string) => {
    await mcpManager.removeServer(name);
    return { ok: true };
  });

  /* ------------------------------------------------------------------ */
  /* MCP — push events from main → renderer                              */
  /* ------------------------------------------------------------------ */

  mcpManager.on('servers-changed', () => {
    broadcastToAll(IpcChannels.McpServerStatusChanged, mcpManager.listServers());
  });

  mcpManager.on('tools-changed', () => {
    broadcastToAll(IpcChannels.McpToolsChanged, mcpManager.listTools());
  });

  /* ------------------------------------------------------------------ */
  /* LLM                                                                 */
  /* ------------------------------------------------------------------ */

  ipcMain.handle(
    IpcChannels.LlmChat,
    async (_evt, payload: LlmChatPayload) => llmManager.chat(payload),
  );

  ipcMain.handle(
    IpcChannels.LlmSetConfigs,
    (_evt, incoming: LlmProviderConfigs) => {
      // Merge: __KEEP__ sentinel means "don't overwrite existing key"
      const existing = llmManager.getConfigs();
      const merged: LlmProviderConfigs = { ...existing };
      for (const [provider, cfg] of Object.entries(incoming)) {
        if (!cfg) continue;
        const p = provider as keyof LlmProviderConfigs;
        if (cfg.apiKey === '__KEEP__') {
          // Keep existing key, only update model
          merged[p] = { apiKey: existing[p]?.apiKey ?? '', defaultModel: cfg.defaultModel };
        } else {
          merged[p] = cfg;
        }
      }
      llmManager.setConfigs(merged);
      saveConfigs(merged);
      return { ok: true };
    },
  );

  ipcMain.handle(IpcChannels.LlmGetConfigs, () => {
    // Return configs with keys masked — renderer only needs to know which
    // providers are configured + which model is selected.
    const configs = llmManager.getConfigs();
    const masked: LlmProviderConfigs = {};
    for (const [provider, cfg] of Object.entries(configs)) {
      if (cfg) {
        masked[provider as keyof LlmProviderConfigs] = {
          apiKey: cfg.apiKey ? '••••••••' : '',
          defaultModel: cfg.defaultModel,
        };
      }
    }
    return masked;
  });

  /* ------------------------------------------------------------------ */
  /* Chat history                                                        */
  /* ------------------------------------------------------------------ */

  ipcMain.handle(IpcChannels.ChatLoadHistory, () => getHistory());
  ipcMain.handle(IpcChannels.ChatClearHistory, () => { clearHistory(); return { ok: true }; });
}
