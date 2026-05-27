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
import { runChat } from '../actions/chat.js';
import { mcpManager } from '../mcp/McpManager.js';
import { llmManager } from '../llm/LlmManager.js';
import type { LlmChatPayload, LlmProviderConfigs } from '../../shared/llm.js';

function broadcastToAll(channel: string, payload: unknown): void {
  BrowserWindow.getAllWindows().forEach((w) => {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  });
}

export function registerIpcHandlers(): void {
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
    (_evt, configs: LlmProviderConfigs) => {
      llmManager.setConfigs(configs);
      return { ok: true };
    },
  );

  ipcMain.handle(IpcChannels.LlmGetConfigs, () => llmManager.getConfigs());
}
