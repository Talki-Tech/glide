/**
 * Built-in catalog of well-known MCP servers.
 * Each entry has enough info to generate a ready-to-use config block.
 * Tokens/paths are placeholders that the user replaces.
 */

export interface CatalogEntry {
  id: string;
  name: string;
  description: string;
  category: 'files' | 'code' | 'web' | 'data' | 'communication' | 'ai' | 'documents';
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

  /* ---- Documents ---- */
  {
    id: 'markitdown',
    name: 'MarkItDown',
    description: 'Read PDF, DOCX, XLSX, PPTX, images, audio — converts everything to Markdown.',
    category: 'documents',
    package: 'markitdown-mcp',
    template: {
      transport: 'stdio',
      command: 'uvx',
      args: ['markitdown-mcp'],
    },
    docsUrl: 'https://github.com/microsoft/markitdown',
  },
  {
    id: 'pdf-reader',
    name: 'PDF Reader',
    description: 'Extract text and metadata from PDF files with chunked pagination.',
    category: 'documents',
    package: '@modelcontextprotocol/server-pdf',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-pdf'],
    },
    docsUrl: 'https://www.npmjs.com/package/@modelcontextprotocol/server-pdf',
  },
  {
    id: 'docx-reader',
    name: 'DOCX Reader',
    description: 'Read and edit Word documents — track changes, comments, footnotes.',
    category: 'documents',
    package: 'docx-mcp',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'docx-mcp'],
    },
    docsUrl: 'https://github.com/SecurityRonin/docx-mcp',
  },
  {
    id: 'doc-ops',
    name: 'Doc Ops',
    description: 'Convert PDF, DOCX, HTML, MD between formats. Batch processing.',
    category: 'documents',
    package: 'doc-ops-mcp',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'doc-ops-mcp'],
    },
    docsUrl: 'https://github.com/Tele-AI/doc-ops-mcp',
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

  /* ---- Data (extra) ---- */
  {
    id: 'excel',
    name: 'Excel / CSV',
    description: 'Read, write, and query Excel (.xlsx) and CSV files.',
    category: 'data',
    package: '@negokaz/excel-mcp-server',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@negokaz/excel-mcp-server'],
    },
    docsUrl: 'https://github.com/negokaz/excel-mcp-server',
  },

  /* ---- Files (extra) ---- */
  {
    id: 'shell',
    name: 'Shell / Terminal',
    description: 'Run shell commands, scripts, and terminal operations.',
    category: 'files',
    package: 'mcp-shell-server',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'mcp-shell-server'],
      env: { ALLOW_COMMANDS: 'ls,cat,pwd,echo,grep,find,mkdir,touch,cp,mv' },
    },
    docsUrl: 'https://github.com/tumf/mcp-shell-server',
  },
  {
    id: 'everything',
    name: 'Everything (Search)',
    description: 'Instant file search across the entire Windows filesystem.',
    category: 'files',
    package: '@modelcontextprotocol/server-everything',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-everything'],
    },
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/everything',
  },

  /* ---- Web (extra) ---- */
  {
    id: 'youtube',
    name: 'YouTube Transcript',
    description: 'Fetch transcripts and metadata from YouTube videos.',
    category: 'web',
    package: 'mcp-youtube',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'mcp-youtube'],
    },
    docsUrl: 'https://github.com/kimtaeyoon83/mcp-server-youtube-transcript',
  },
  {
    id: 'playwright',
    name: 'Playwright Browser',
    description: 'Full browser automation — navigate, click, screenshot, extract content.',
    category: 'web',
    package: '@playwright/mcp',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@playwright/mcp'],
    },
    docsUrl: 'https://github.com/microsoft/playwright-mcp',
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
  {
    id: 'time',
    name: 'Time & Timezone',
    description: 'Get current time, convert between timezones, calculate durations.',
    category: 'ai',
    package: '@modelcontextprotocol/server-time',
    template: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-time'],
    },
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
  },
];

export const CATALOG_CATEGORIES = [
  { id: 'all',           label: 'All' },
  { id: 'files',         label: 'Files' },
  { id: 'documents',     label: 'Docs' },
  { id: 'code',          label: 'Code' },
  { id: 'web',           label: 'Web' },
  { id: 'data',          label: 'Data' },
  { id: 'communication', label: 'Comms' },
  { id: 'ai',            label: 'AI' },
] as const;
