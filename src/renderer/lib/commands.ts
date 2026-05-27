import type { CommandEntry } from './types';
import {
  VSCodeIcon,
  TerminalIcon,
  SlackIcon,
  XIcon,
  ChatIcon,
} from '../components/icons';

/**
 * Single source of truth for the result-list contents.
 * Each entry holds its own `run()` so the UI layer never speaks IPC directly.
 */
export const commandRegistry: CommandEntry[] = [
  {
    id: 'tweet-glidehq',
    label: 'Draft tweet for @Glidehq',
    description: 'Compose and queue a draft via the X API.',
    shortcut: 'Ctrl+D',
    Icon: XIcon,
    emphasis: 'primary',
    keywords: ['tweet', 'twitter', 'x', 'glidehq', 'social', 'draft'],
    run: () =>
      window.glide.actions.tweet({
        handle: '@Glidehq',
        text: 'Shipping fast with Glide — the visual command center for builders.',
      }),
  },
  {
    id: 'open-nexus-crm',
    label: 'Open "Nexus CRM" Project',
    description: 'Launch the project in VS Code.',
    shortcut: 'Ctrl+E',
    Icon: VSCodeIcon,
    keywords: ['vscode', 'editor', 'nexus', 'crm', 'open', 'project'],
    run: () =>
      window.glide.actions.openVSCode({
        projectName: 'Nexus CRM',
      }),
  },
  {
    id: 'vercel-deploy',
    label: 'Run build & deploy to Vercel',
    description: 'Trigger `vercel deploy --prod` in the current directory.',
    shortcut: 'Ctrl+V',
    Icon: TerminalIcon,
    keywords: ['vercel', 'deploy', 'build', 'ship', 'production'],
    run: () =>
      window.glide.actions.deployVercel({
        project: 'glide-web',
        env: 'production',
      }),
  },
  {
    id: 'sync-prs',
    label: 'Sync GitHub PRs to Slack',
    description: 'Post open pull requests to the #engineering channel.',
    shortcut: 'Ctrl+P',
    Icon: SlackIcon,
    keywords: ['github', 'slack', 'sync', 'pr', 'pull request'],
    run: () =>
      window.glide.actions.syncGithubPRs({
        repo: 'glidehq/glide',
        slackChannel: '#engineering',
      }),
  },
  {
    id: 'x-limits',
    label: 'Check X API limits',
    description: 'See your current request quota and reset window.',
    shortcut: 'Ctrl+L',
    Icon: ChatIcon,
    keywords: ['x', 'twitter', 'api', 'rate', 'limit'],
    run: () => window.glide.actions.checkXLimits({}),
  },
];

/**
 * Lightweight fuzzy-ish filter — substring on label + keyword bag, case-insensitive.
 * Keeps the registry order stable so the mint-emphasized item stays on top
 * when the query is empty.
 */
export function filterCommands(query: string): CommandEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return commandRegistry;
  return commandRegistry.filter((c) => {
    const haystack = `${c.label} ${c.description ?? ''} ${(c.keywords ?? []).join(' ')}`.toLowerCase();
    return haystack.includes(q);
  });
}
