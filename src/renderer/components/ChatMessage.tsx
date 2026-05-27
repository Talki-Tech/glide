import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { useGlideStore } from '../store/useGlideStore';

/**
 * Parses and renders a chat message.
 * Supports markdown + special <glide:*> command blocks.
 */

interface Props {
  content: string;
}

/* ------------------------------------------------------------------ */
/* Glide command parser                                                */
/* ------------------------------------------------------------------ */

type GlideCmd =
  | { type: 'open-settings'; tab?: string }
  | { type: 'run-command'; id: string; label?: string }
  | { type: 'badge'; color: string; text: string }
  | { type: 'progress'; value: number; label?: string }
  | { type: 'card'; title: string; body: string; color?: string }
  | { type: 'unknown'; raw: string };

function parseGlideTag(raw: string): GlideCmd {
  // <glide:open-settings tab="ai">
  const openSettings = raw.match(/^glide:open-settings(?:\s+tab="([^"]*)")?/);
  if (openSettings) return { type: 'open-settings', tab: openSettings[1] };

  // <glide:run-command id="tweet-glidehq" label="Draft Tweet">
  const runCmd = raw.match(/^glide:run-command\s+id="([^"]*)"(?:\s+label="([^"]*)")?/);
  if (runCmd) return { type: 'run-command', id: runCmd[1], label: runCmd[2] };

  // <glide:badge color="mint" text="Done">
  const badge = raw.match(/^glide:badge\s+color="([^"]*)"\s+text="([^"]*)"/);
  if (badge) return { type: 'badge', color: badge[1], text: badge[2] };

  // <glide:progress value=75 label="Building...">
  const progress = raw.match(/^glide:progress\s+value=(\d+)(?:\s+label="([^"]*)")?/);
  if (progress) return { type: 'progress', value: Number(progress[1]), label: progress[2] };

  // <glide:card title="Result" color="mint">body text</glide:card>
  const card = raw.match(/^glide:card\s+title="([^"]*)"(?:\s+color="([^"]*)")?>([\s\S]*)<\/glide:card/);
  if (card) return { type: 'card', title: card[1], color: card[2], body: card[3].trim() };

  return { type: 'unknown', raw };
}

/**
 * Split message content into text segments and glide command segments.
 */
type Segment = { kind: 'text'; content: string } | { kind: 'glide'; cmd: GlideCmd };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match both self-closing <glide:...> and paired <glide:card ...>...</glide:card>
  const re = /<(glide:card\s[^>]*>[\s\S]*?<\/glide:card>|glide:[^>]+)>/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ kind: 'text', content: text.slice(last, match.index) });
    }
    segments.push({ kind: 'glide', cmd: parseGlideTag(match[1]) });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ kind: 'text', content: text.slice(last) });
  }

  return segments;
}

/* ------------------------------------------------------------------ */
/* Glide command renderers                                             */
/* ------------------------------------------------------------------ */

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  mint:   { border: 'border-mint-500/50',   bg: 'bg-mint-500/10',   text: 'text-mint-200',   dot: 'bg-mint-400' },
  cyan:   { border: 'border-cyan-500/50',   bg: 'bg-cyan-500/10',   text: 'text-cyan-200',   dot: 'bg-cyan-400' },
  amber:  { border: 'border-amber-500/50',  bg: 'bg-amber-500/10',  text: 'text-amber-200',  dot: 'bg-amber-400' },
  red:    { border: 'border-red-500/50',    bg: 'bg-red-500/10',    text: 'text-red-200',    dot: 'bg-red-400' },
  violet: { border: 'border-violet-500/50', bg: 'bg-violet-500/10', text: 'text-violet-200', dot: 'bg-violet-400' },
};

function colorClasses(color = 'mint') {
  return COLOR_MAP[color] ?? COLOR_MAP['mint'];
}

function GlideBadge({ cmd }: { cmd: Extract<GlideCmd, { type: 'badge' }> }) {
  const c = colorClasses(cmd.color);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold ${c.border} ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {cmd.text}
    </span>
  );
}

function GlideProgress({ cmd }: { cmd: Extract<GlideCmd, { type: 'progress' }> }) {
  const pct = Math.max(0, Math.min(100, cmd.value));
  return (
    <div className="my-1 flex flex-col gap-1">
      {cmd.label && <span className="text-[11px] text-ink-400">{cmd.label}</span>}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-mint-400"
        />
      </div>
      <span className="text-right text-[10px] text-ink-500">{pct}%</span>
    </div>
  );
}

function GlideCard({ cmd }: { cmd: Extract<GlideCmd, { type: 'card' }> }) {
  const c = colorClasses(cmd.color);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`my-1 rounded-md border p-3 ${c.border} ${c.bg}`}
    >
      <p className={`mb-1 text-[11px] font-semibold uppercase tracking-wider ${c.text}`}>{cmd.title}</p>
      <p className="text-[12.5px] text-ink-200">{cmd.body}</p>
    </motion.div>
  );
}

function GlideRunCommand({ cmd }: { cmd: Extract<GlideCmd, { type: 'run-command' }> }) {
  const { setView } = useGlideStore();
  return (
    <button
      onClick={() => setView('palette')}
      className="my-0.5 inline-flex items-center gap-1.5 rounded border border-mint-500/50 bg-mint-500/10 px-2.5 py-1 text-[11px] font-medium text-mint-200 transition-colors hover:bg-mint-500/20"
    >
      ▶ {cmd.label ?? cmd.id}
    </button>
  );
}

function GlideOpenSettings({ cmd }: { cmd: Extract<GlideCmd, { type: 'open-settings' }> }) {
  const { setView } = useGlideStore();
  return (
    <button
      onClick={() => setView('settings')}
      className="my-0.5 inline-flex items-center gap-1.5 rounded border border-ink-600 bg-ink-800 px-2.5 py-1 text-[11px] font-medium text-ink-200 transition-colors hover:border-mint-500/50 hover:text-mint-200"
    >
      ⚙ Open Settings{cmd.tab ? ` → ${cmd.tab}` : ''}
    </button>
  );
}

function GlideCmdRenderer({ cmd }: { cmd: GlideCmd }) {
  switch (cmd.type) {
    case 'badge':        return <GlideBadge cmd={cmd} />;
    case 'progress':     return <GlideProgress cmd={cmd} />;
    case 'card':         return <GlideCard cmd={cmd} />;
    case 'run-command':  return <GlideRunCommand cmd={cmd} />;
    case 'open-settings': return <GlideOpenSettings cmd={cmd} />;
    default:             return null;
  }
}

/* ------------------------------------------------------------------ */
/* Markdown components                                                 */
/* ------------------------------------------------------------------ */

const mdComponents = {
  // Code blocks
  code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <pre className="my-2 overflow-x-auto rounded border border-ink-700 bg-ink-900 p-3">
          <code className={`font-mono text-[11px] text-ink-100 ${className ?? ''}`} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[11px] text-mint-300" {...props}>
        {children}
      </code>
    );
  },
  // Headings
  h1: ({ children }: React.ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="mb-1 mt-2 text-[15px] font-bold text-ink-50">{children}</h1>
  ),
  h2: ({ children }: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="mb-1 mt-2 text-[13px] font-semibold text-ink-100">{children}</h2>
  ),
  h3: ({ children }: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="mb-0.5 mt-1.5 text-[12px] font-semibold text-ink-200">{children}</h3>
  ),
  // Lists
  ul: ({ children }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-1 ml-4 list-disc space-y-0.5 text-[13px]">{children}</ul>
  ),
  ol: ({ children }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-1 ml-4 list-decimal space-y-0.5 text-[13px]">{children}</ol>
  ),
  li: ({ children }: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="text-ink-200">{children}</li>
  ),
  // Paragraphs
  p: ({ children }: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="my-0.5 text-[13px] leading-relaxed text-ink-100">{children}</p>
  ),
  // Strong / em
  strong: ({ children }: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-ink-50">{children}</strong>
  ),
  em: ({ children }: React.ComponentPropsWithoutRef<'em'>) => (
    <em className="italic text-ink-300">{children}</em>
  ),
  // Blockquote
  blockquote: ({ children }: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-1 border-l-2 border-mint-500/50 pl-3 text-[12px] italic text-ink-400">
      {children}
    </blockquote>
  ),
  // Horizontal rule
  hr: () => <hr className="my-2 border-ink-700" />,
  // Links
  a: ({ href, children }: React.ComponentPropsWithoutRef<'a'>) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-mint-400 underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  // Table
  table: ({ children }: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">{children}</table>
    </div>
  ),
  th: ({ children }: React.ComponentPropsWithoutRef<'th'>) => (
    <th className="border border-ink-700 bg-ink-800 px-2 py-1 text-left font-semibold text-ink-200">{children}</th>
  ),
  td: ({ children }: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="border border-ink-700 px-2 py-1 text-ink-300">{children}</td>
  ),
};

/* ------------------------------------------------------------------ */
/* Main export                                                         */
/* ------------------------------------------------------------------ */

export function ChatMessageContent({ content }: Props) {
  const segments = parseSegments(content);

  return (
    <div className="flex flex-col gap-0.5">
      {segments.map((seg, i) =>
        seg.kind === 'glide' ? (
          <GlideCmdRenderer key={i} cmd={seg.cmd} />
        ) : (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm]}
            components={mdComponents as Record<string, React.ElementType>}
          >
            {seg.content}
          </ReactMarkdown>
        ),
      )}
    </div>
  );
}
