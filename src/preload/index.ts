import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  IpcChannels,
  type ActionResult,
  type ChatRequest,
  type ChatResponse,
  type CheckXLimitsPayload,
  type OpenVSCodePayload,
  type SyncGithubPRsPayload,
  type SystemStatus,
  type TweetPayload,
  type VercelDeployPayload,
  type McpServerConfig,
  type McpServerState,
  type McpTool,
  type McpCallToolPayload,
  type McpCallToolResult,
} from '../shared/ipc.js';
import type { LlmChatPayload, LlmChatResult, LlmProviderConfigs } from '../shared/llm.js';

/**
 * The single object the renderer is allowed to touch. Everything
 * coming back is strongly typed; everything going in is invoked
 * through ipcRenderer — never directly through Node APIs.
 */
const glideAPI = {
  window: {
    hide: () => ipcRenderer.send(IpcChannels.WindowHide),
    toggle: () => ipcRenderer.send(IpcChannels.WindowToggle),
    minimize: () => ipcRenderer.send(IpcChannels.WindowMinimize),
    maximize: () => ipcRenderer.send(IpcChannels.WindowMaximize),
    close: () => ipcRenderer.send(IpcChannels.WindowClose),
  },

  actions: {
    tweet: (payload: TweetPayload): Promise<ActionResult> =>
      ipcRenderer.invoke(IpcChannels.ActionTweet, payload),

    openVSCode: (payload: OpenVSCodePayload): Promise<ActionResult> =>
      ipcRenderer.invoke(IpcChannels.ActionOpenVSCode, payload),

    deployVercel: (payload: VercelDeployPayload): Promise<ActionResult> =>
      ipcRenderer.invoke(IpcChannels.ActionVercelDeploy, payload),

    syncGithubPRs: (payload: SyncGithubPRsPayload): Promise<ActionResult> =>
      ipcRenderer.invoke(IpcChannels.ActionSyncGithubPRs, payload),

    checkXLimits: (payload: CheckXLimitsPayload): Promise<ActionResult> =>
      ipcRenderer.invoke(IpcChannels.ActionCheckXLimits, payload),
  },

  chat: {
    send: (req: ChatRequest): Promise<ChatResponse> =>
      ipcRenderer.invoke(IpcChannels.ChatSendMessage, req),
  },

  status: {
    onUpdate(cb: (status: SystemStatus) => void): () => void {
      const handler = (_evt: IpcRendererEvent, status: SystemStatus) => cb(status);
      ipcRenderer.on(IpcChannels.SystemStatus, handler);
      return () => ipcRenderer.removeListener(IpcChannels.SystemStatus, handler);
    },
  },

  mcp: {
    listServers: (): Promise<McpServerState[]> =>
      ipcRenderer.invoke(IpcChannels.McpListServers),

    listTools: (): Promise<McpTool[]> =>
      ipcRenderer.invoke(IpcChannels.McpListTools),

    callTool: (payload: McpCallToolPayload): Promise<McpCallToolResult> =>
      ipcRenderer.invoke(IpcChannels.McpCallTool, payload),

    addServer: (config: McpServerConfig): Promise<{ ok: boolean }> =>
      ipcRenderer.invoke(IpcChannels.McpAddServer, config),

    removeServer: (name: string): Promise<{ ok: boolean }> =>
      ipcRenderer.invoke(IpcChannels.McpRemoveServer, name),

    onServersChanged(cb: (servers: McpServerState[]) => void): () => void {
      const h = (_evt: IpcRendererEvent, servers: McpServerState[]) => cb(servers);
      ipcRenderer.on(IpcChannels.McpServerStatusChanged, h);
      return () => ipcRenderer.removeListener(IpcChannels.McpServerStatusChanged, h);
    },

    onToolsChanged(cb: (tools: McpTool[]) => void): () => void {
      const h = (_evt: IpcRendererEvent, tools: McpTool[]) => cb(tools);
      ipcRenderer.on(IpcChannels.McpToolsChanged, h);
      return () => ipcRenderer.removeListener(IpcChannels.McpToolsChanged, h);
    },
  },

  llm: {
    chat: (payload: LlmChatPayload): Promise<LlmChatResult> =>
      ipcRenderer.invoke(IpcChannels.LlmChat, payload),

    setConfigs: (configs: LlmProviderConfigs): Promise<{ ok: boolean }> =>
      ipcRenderer.invoke(IpcChannels.LlmSetConfigs, configs),

    getConfigs: (): Promise<LlmProviderConfigs> =>
      ipcRenderer.invoke(IpcChannels.LlmGetConfigs),
  },
};

export type GlideAPI = typeof glideAPI;

contextBridge.exposeInMainWorld('glide', glideAPI);
