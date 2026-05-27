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
} from '../shared/ipc.js';

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
};

export type GlideAPI = typeof glideAPI;

contextBridge.exposeInMainWorld('glide', glideAPI);
