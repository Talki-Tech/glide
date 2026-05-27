/**
 * Built-in catalog of well-known MCP servers.
 * Each entry has enough info to generate a ready-to-use config block.
 * Tokens/paths are placeholders that the user replaces.
 */

export interface CatalogEntry {
  id: string;
  name: string;
  description: string;
  category: 'files' | 'code' | 'web' | 'data' | 'communication' | 'ai';
  /** npm package or binary name — shown as badge */
  package: string;
  /** Pre-filled JSON (without the outer name key) */
  template: {
    transport: 'stdio' | 'http';
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
  };
  /** Which env keys need real values from the user */
  requiredTokens?: { key: string; label: string; placeholder: string }[];
  /** Args that the user should configure (index + label + placeholder) */
  configurableArgs?: { index: number; label: string; placeholder: string }[];
  docsUrl?: string;
}

export const MCP_CATALOG: CatalogEntry[] = [
  /* ---- Files ---- */
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read, write, and search files on local disk.',
    category: 'files',
    package: '@modelcontextprotocol/server-filesystem',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', 'C:\\Users'],
    },
    configurableArgs: [
      { index: 2, label: 'Allowed directory', placeholder: 'C:\\Users\\YourName' },
    ],
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
  },

  /* ---- Code ---- */
  {
    id: 'github',
    name: 'GitHub',
    description: 'List repos, read files, manage issues and PRs.',
    category: 'code',
    package: '@modelcontextprotocol/server-github',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_YOUR_TOKEN' },
    },
    requiredTokens: [
      { key: 'GITHUB_PERSONAL_ACCESS_TOKEN', label: 'GitHub PAT', placeholder: 'ghp_...' },
    ],
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Access GitLab repos, MRs, and CI pipelines.',
    category: 'code',
    package: '@modelcontextprotocol/server-gitlab',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-gitlab'],
      env: {
        GITLAB_PERSONAL_ACCESS_TOKEN: 'glpat_YOUR_TOKEN',
        GITLAB_API_URL: 'https://gitlab.com/api/v4',
      },
    },
    requiredTokens: [
      { key: 'GITLAB_PERSONAL_ACCESS_TOKEN', label: 'GitLab PAT', placeholder: 'glpat_...' },
    ],
  },

  /* ---- Web ---- */
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Web search via Brave Search API.',
    category: 'web',
    package: '@modelcontextprotocol/server-brave-search',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      env: { BRAVE_API_KEY: 'YOUR_BRAVE_API_KEY' },
    },
    requiredTokens: [
      { key: 'BRAVE_API_KEY', label: 'Brave API Key', placeholder: 'BSA...' },
    ],
    docsUrl: 'https://brave.com/search/api/',
  },
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'Fetch any URL — get HTML, JSON, or raw text.',
    category: 'web',
    package: '@modelcontextprotocol/server-fetch',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-fetch'],
    },
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Browser automation — click, screenshot, scrape.',
    category: 'web',
    package: '@modelcontextprotocol/server-puppeteer',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    },
  },

  /* ---- Data ---- */
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Query and inspect a Postgres database.',
    category: 'data',
    package: '@modelcontextprotocol/server-postgres',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://user:pass@localhost/db'],
    },
    configurableArgs: [
      { index: 2, label: 'Connection URL', placeholder: 'postgresql://user:pass@localhost/mydb' },
    ],
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Query a local SQLite file.',
    category: 'data',
    package: '@modelcontextprotocol/server-sqlite',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', 'C:\\data\\my.db'],
    },
    configurableArgs: [
      { index: 3, label: 'Database path', placeholder: 'C:\\data\\my.db' },
    ],
  },

  /* ---- Communication ---- */
  {
    id: 'slack',
    name: 'Slack',
    description: 'Read channels, post messages, list users.',
    category: 'communication',
    package: '@modelcontextprotocol/server-slack',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      env: {
        SLACK_BOT_TOKEN: 'xoxb-YOUR_TOKEN',
        SLACK_TEAM_ID: 'T0YOUR_TEAM',
      },
    },
    requiredTokens: [
      { key: 'SLACK_BOT_TOKEN', label: 'Slack Bot Token', placeholder: 'xoxb-...' },
      { key: 'SLACK_TEAM_ID', label: 'Slack Team ID', placeholder: 'T0...' },
    ],
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'List, read, and search files in Google Drive.',
    category: 'communication',
    package: '@modelcontextprotocol/server-gdrive',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-gdrive'],
    },
  },

  /* ---- AI ---- */
  {
    id: 'memory',
    name: 'Memory',
    description: 'Persistent key-value memory across sessions.',
    category: 'ai',
    package: '@modelcontextprotocol/server-memory',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: 'Step-by-step reasoning tool for complex problems.',
    category: 'ai',
    package: '@modelcontextprotocol/server-sequential-thinking',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    },
  },
];

export const CATALOG_CATEGORIES = [
  { id: 'all',           label: 'All' },
  { id: 'files',         label: 'Files' },
  { id: 'code',          label: 'Code' },
  { id: 'web',           label: 'Web' },
  { id: 'data',          label: 'Data' },
  { id: 'communication', label: 'Comms' },
  { id: 'ai',            label: 'AI' },
] as const;
