import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { app } from 'electron';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import type {
  McpServerConfig,
  McpServerState,
  McpServerStatus,
  McpTool,
  McpCallToolPayload,
  McpCallToolResult,
  McpServersFile,
  McpContentBlock,
} from '../../shared/ipc.js';

/**
 * Events emitted by MCPManager:
 *   'servers-changed'  — server list or status changed
 *   'tools-changed'    — tool registry updated
 */
export class MCPManager extends EventEmitter {
  private clients = new Map<string, Client>();
  private states = new Map<string, McpServerState>();
  private tools = new Map<string, McpTool[]>(); // keyed by serverName
  private configPath: string;

  constructor() {
    super();
    const glideDir = join(app.getPath('home'), '.glide');
    if (!existsSync(glideDir)) mkdirSync(glideDir, { recursive: true });
    this.configPath = join(glideDir, 'servers.json');
    if (!existsSync(this.configPath)) {
      this.writeConfig({ mcpServers: {} });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Config persistence                                                   */
  /* ------------------------------------------------------------------ */

  private readConfig(): McpServersFile {
    try {
      return JSON.parse(readFileSync(this.configPath, 'utf8')) as McpServersFile;
    } catch {
      return { mcpServers: {} };
    }
  }

  private writeConfig(cfg: McpServersFile): void {
    writeFileSync(this.configPath, JSON.stringify(cfg, null, 2), 'utf8');
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                            */
  /* ------------------------------------------------------------------ */

  /** Call once on app startup — connects to all configured servers. */
  async init(): Promise<void> {
    const cfg = this.readConfig();
    const entries = Object.entries(cfg.mcpServers);
    await Promise.allSettled(
      entries.map(([name, conf]) => this.connect({ name, ...conf })),
    );
  }

  async shutdown(): Promise<void> {
    await Promise.allSettled(
      [...this.clients.entries()].map(([name, c]) => this.disconnect(name, c)),
    );
  }

  /* ------------------------------------------------------------------ */
  /* Connect / disconnect                                                 */
  /* ------------------------------------------------------------------ */

  private setStatus(name: string, status: McpServerStatus, error?: string): void {
    const prev = this.states.get(name);
    if (!prev) return;
    this.states.set(name, { ...prev, status, error });
    this.emit('servers-changed');
  }

  async connect(config: McpServerConfig): Promise<void> {
    // If already tracked and connected, skip.
    const existing = this.states.get(config.name);
    if (existing?.status === 'connected') return;

    this.states.set(config.name, {
      ...config,
      status: 'connecting',
      toolCount: 0,
    });
    this.emit('servers-changed');

    try {
      const client = new Client(
        { name: 'glide', version: '0.1.0' },
        { capabilities: {} },
      );

      let transport;
      if (config.transport === 'http' && config.url) {
        transport = new StreamableHTTPClientTransport(new URL(config.url));
      } else {
        if (!config.command) throw new Error('stdio server requires "command"');
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args ?? [],
          env: { ...process.env, ...(config.env ?? {}) } as Record<string, string>,
        });
      }

      await client.connect(transport);
      this.clients.set(config.name, client);

      await this.refreshTools(config.name, client);

      this.setStatus(config.name, 'connected');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setStatus(config.name, 'error', msg);
    }
  }

  private async disconnect(name: string, client: Client): Promise<void> {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    this.clients.delete(name);
    this.tools.delete(name);
    this.states.delete(name);
    this.emit('servers-changed');
    this.emit('tools-changed');
  }

  /* ------------------------------------------------------------------ */
  /* Tool discovery                                                       */
  /* ------------------------------------------------------------------ */

  private async refreshTools(serverName: string, client: Client): Promise<void> {
    try {
      const res = await client.listTools();
      const mapped: McpTool[] = (res.tools ?? []).map((t) => ({
        id: `${serverName}/${t.name}`,
        serverName,
        name: t.name,
        description: t.description,
        inputSchema: (t.inputSchema as Record<string, unknown>) ?? {},
      }));
      this.tools.set(serverName, mapped);

      // Update toolCount in state
      const state = this.states.get(serverName);
      if (state) {
        this.states.set(serverName, { ...state, toolCount: mapped.length });
      }

      this.emit('tools-changed');
    } catch (err) {
      // Non-fatal — server might not support tools
      this.tools.set(serverName, []);
      this.emit('tools-changed');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Tool call                                                            */
  /* ------------------------------------------------------------------ */

  async callTool(payload: McpCallToolPayload): Promise<McpCallToolResult> {
    const client = this.clients.get(payload.serverId);
    if (!client) {
      return {
        ok: false,
        content: [],
        error: `Server "${payload.serverId}" not connected.`,
      };
    }

    try {
      const res = await client.callTool({
        name: payload.toolName,
        arguments: payload.args,
      });

      type RawBlock = { type: string; text?: string; data?: string; mimeType?: string };
      const rawContent = Array.isArray(res.content) ? (res.content as RawBlock[]) : [];
      const content: McpContentBlock[] = rawContent.map((block) => {
        if (block.type === 'text') {
          return { type: 'text', text: block.text };
        }
        if (block.type === 'image') {
          return { type: 'image', data: block.data, mimeType: block.mimeType };
        }
        return { type: 'resource', text: JSON.stringify(block) };
      });

      return { ok: true, content };
    } catch (err) {
      return {
        ok: false,
        content: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Public query API (called by IPC handlers)                           */
  /* ------------------------------------------------------------------ */

  listServers(): McpServerState[] {
    return [...this.states.values()];
  }

  listTools(): McpTool[] {
    return [...this.tools.values()].flat();
  }

  /* ------------------------------------------------------------------ */
  /* Server management (add / remove)                                    */
  /* ------------------------------------------------------------------ */

  async addServer(config: McpServerConfig): Promise<void> {
    const cfg = this.readConfig();
    const { name, ...rest } = config;
    cfg.mcpServers[name] = rest;
    this.writeConfig(cfg);
    await this.connect(config);
  }

  async removeServer(name: string): Promise<void> {
    const cfg = this.readConfig();
    delete cfg.mcpServers[name];
    this.writeConfig(cfg);

    const client = this.clients.get(name);
    if (client) await this.disconnect(name, client);
    else {
      this.states.delete(name);
      this.tools.delete(name);
      this.emit('servers-changed');
      this.emit('tools-changed');
    }
  }

  /** Re-read config and reconnect any server not currently connected. */
  async reloadConfig(): Promise<void> {
    const cfg = this.readConfig();
    for (const [name, conf] of Object.entries(cfg.mcpServers)) {
      if (!this.states.has(name) || this.states.get(name)?.status === 'error') {
        await this.connect({ name, ...conf });
      }
    }
  }
}

/** Singleton — shared across the entire main process. */
export const mcpManager = new MCPManager();
