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

  // MCP
  McpListServers: 'mcp:list-servers',
  McpAddServer: 'mcp:add-server',
  McpRemoveServer: 'mcp:remove-server',
  McpListTools: 'mcp:list-tools',
  McpCallTool: 'mcp:call-tool',
  McpServerStatusChanged: 'mcp:server-status-changed',
  McpToolsChanged: 'mcp:tools-changed',
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

/* ---------------- MCP types ---------------- */

/** Transport type for an MCP server. */
export type McpTransport = 'stdio' | 'http';

/** One server entry as stored in servers.json and passed over IPC. */
export interface McpServerConfig {
  /** Unique name / key (same as key in mcpServers object). */
  name: string;
  transport: McpTransport;
  /** For stdio: executable to spawn. */
  command?: string;
  /** For stdio: args to pass. */
  args?: string[];
  /** Env vars injected into the spawned process. */
  env?: Record<string, string>;
  /** For http: base URL of the MCP HTTP+SSE endpoint. */
  url?: string;
}

export type McpServerStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

export interface McpServerState extends McpServerConfig {
  status: McpServerStatus;
  error?: string;
  toolCount: number;
}

/** A single tool as reported by tools/list. */
export interface McpTool {
  /** "serverName/toolName" — globally unique. */
  id: string;
  serverName: string;
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface McpCallToolPayload {
  serverId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface McpCallToolResult {
  ok: boolean;
  content: McpContentBlock[];
  error?: string;
}

export interface McpContentBlock {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

/** Full servers.json file shape (compatible with Claude Desktop). */
export interface McpServersFile {
  mcpServers: Record<string, Omit<McpServerConfig, 'name'>>;
}
