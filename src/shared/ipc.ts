/**
 * Shared IPC contract between Electron main and renderer.
 * Renderer must never import Node APIs directly — everything
 * crosses through these typed channels via the preload bridge.
 */

export const IpcChannels = {
  WindowHide: 'window:hide',
  WindowToggle: 'window:toggle',
  WindowMinimize: 'window:minimize',
  WindowMaximize: 'window:maximize',
  WindowClose: 'window:close',

  ActionTweet: 'action:tweet',
  ActionOpenVSCode: 'action:open-vscode',
  ActionVercelDeploy: 'action:vercel-deploy',
  ActionSyncGithubPRs: 'action:sync-github-prs',
  ActionCheckXLimits: 'action:check-x-limits',

  ChatSendMessage: 'chat:send',

  SystemStatus: 'system:status',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

/** Standard envelope returned by every action handler. */
export interface ActionResult<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
  /** ISO timestamp of completion. */
  at: string;
}

/* ---------------- Action payloads ---------------- */

export interface TweetPayload {
  handle: string;
  text: string;
}

export interface OpenVSCodePayload {
  projectName: string;
  path?: string;
}

export interface VercelDeployPayload {
  project: string;
  env: 'preview' | 'production';
}

export interface SyncGithubPRsPayload {
  repo: string;
  slackChannel: string;
}

export interface CheckXLimitsPayload {
  /** Optional bearer for the X API call; mock if absent. */
  token?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  reply: ChatMessage;
}

/* ---------------- System status ---------------- */

export interface SystemStatus {
  llm: string;
  connectedServices: number;
  online: boolean;
}
