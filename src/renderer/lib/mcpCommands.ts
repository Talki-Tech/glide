import type { McpTool } from '../../shared/ipc';
import type { CommandEntry } from './types';
import type { IconComponent } from './types';
import {
  SparkleIcon,
  TerminalIcon,
  SearchIcon,
  GithubIcon,
  SlackIcon,
  ChatIcon,
  CogIcon,
} from '../components/icons';

/** Pick icon by tool name keywords. */
function iconForTool(toolName: string, serverName: string): IconComponent {
  const n = `${toolName} ${serverName}`.toLowerCase();
  if (/read|write|file|dir|path|list|tree|move|edit|creat/.test(n)) return TerminalIcon;
  if (/search|find|query|grep|fetch|web|browse/.test(n))             return SearchIcon;
  if (/github|git|pr|repo|issue|commit/.test(n))                     return GithubIcon;
  if (/slack|message|channel|post|send/.test(n))                     return SlackIcon;
  if (/chat|ask|think|reason|memory/.test(n))                        return ChatIcon;
  if (/config|setting|tool|exec|run|spawn/.test(n))                  return CogIcon;
  return SparkleIcon;
}

/**
 * Converts a list of MCP tools into CommandEntry objects so they
 * appear in the palette alongside static commands. Each tool's
 * run() calls tools/call over IPC and returns a normalised ActionResult.
 */
export function mcpToolsToCommands(tools: McpTool[]): CommandEntry[] {
  return tools.map((tool) => ({
    id: `mcp:${tool.id}`,
    label: tool.name,
    description: tool.description ?? `${tool.serverName} · MCP tool`,
    Icon: iconForTool(tool.name, tool.serverName),
    keywords: ['mcp', tool.serverName, tool.name],
    run: async () => {
      // Build args from inputSchema — required fields get empty defaults
      // so the tool can at least be invoked without a form UI.
      // A proper arg-editor UI can replace this later.
      const args = buildDefaultArgs(tool.inputSchema);

      const result = await window.glide.mcp.callTool({
        serverId: tool.serverName,
        toolName: tool.name,
        args,
      });

      return {
        ok: result.ok,
        message: result.ok
          ? (result.content.find((b) => b.type === 'text')?.text ??
            `${tool.name} executed.`)
          : (result.error ?? 'Tool call failed.'),
        data: result,
        at: new Date().toISOString(),
      };
    },
  }));
}

/**
 * Builds a minimal args object satisfying the required fields of
 * a JSON Schema. Values are empty strings / 0 / false depending on type.
 * This keeps tool calls non-crashing even without a form UI.
 */
function buildDefaultArgs(schema: Record<string, unknown>): Record<string, unknown> {
  const props = (schema['properties'] ?? {}) as Record<string, { type?: string }>;
  const required = (schema['required'] ?? []) as string[];
  const args: Record<string, unknown> = {};
  for (const key of required) {
    const prop = props[key];
    switch (prop?.type) {
      case 'number':
      case 'integer':
        args[key] = 0;
        break;
      case 'boolean':
        args[key] = false;
        break;
      case 'array':
        args[key] = [];
        break;
      case 'object':
        args[key] = {};
        break;
      default:
        args[key] = '';
    }
  }
  return args;
}
