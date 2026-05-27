import { motion, AnimatePresence } from 'framer-motion';
import { useGlideStore } from '../store/useGlideStore';
import type { McpCallToolResult } from '../../shared/ipc';
import { CloseIcon, CheckIcon } from './icons';

/**
 * Slide-in panel at the bottom of the palette showing the last
 * MCP tool call result. Appears only when the result has MCP data
 * (ActionResult.data is McpCallToolResult).
 *
 * Replaces the generic toast for tool calls.
 */
export function ToolResultPanel() {
  const { lastResult, setLastResult } = useGlideStore();

  const mcpResult = lastResult?.data as McpCallToolResult | undefined;
  const isMcp = mcpResult && typeof mcpResult === 'object' && 'content' in mcpResult;

  return (
    <AnimatePresence>
      {lastResult && isMcp && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="absolute bottom-7 left-4 right-4 z-50 rounded border border-ink-700 bg-ink-900 shadow-lg"
        >
          {/* Header */}
          <div className={`flex items-center justify-between border-b px-3 py-2 ${lastResult.ok ? 'border-mint-500/30' : 'border-red-500/30'}`}>
            <div className="flex items-center gap-2">
              {lastResult.ok ? (
                <CheckIcon className="h-3.5 w-3.5 text-mint-400" />
              ) : (
                <CloseIcon className="h-3.5 w-3.5 text-red-400" />
              )}
              <span className={`text-[11px] font-semibold ${lastResult.ok ? 'text-mint-200' : 'text-red-200'}`}>
                {lastResult.message}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {mcpResult.content.length > 0 && (
                <button
                  onClick={() => {
                    const text = mcpResult.content.map((b) => b.text ?? b.data ?? '').join('\n');
                    navigator.clipboard.writeText(text).catch(() => {});
                  }}
                  className="rounded border border-ink-700 bg-ink-850 px-2 py-0.5 text-[10px] font-medium text-ink-300 hover:border-ink-600 hover:text-ink-100"
                >
                  Copy
                </button>
              )}
              <button
                onClick={() => setLastResult(null)}
                className="rounded p-1 text-ink-400 hover:bg-ink-800 hover:text-ink-100"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Content blocks */}
          <div className="max-h-40 overflow-y-auto p-3" data-selectable>
            {mcpResult.content.length === 0 && !mcpResult.error ? (
              <p className="text-[11px] text-ink-400">No output returned.</p>
            ) : mcpResult.error ? (
              <p className="font-mono text-[11px] text-red-300">{mcpResult.error}</p>
            ) : (
              mcpResult.content.map((block, i) => (
                <div key={i}>
                  {block.type === 'text' && (
                    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-ink-100">
                      {block.text}
                    </pre>
                  )}
                  {block.type === 'image' && block.data && (
                    <img
                      src={`data:${block.mimeType ?? 'image/png'};base64,${block.data}`}
                      alt="Tool output"
                      className="max-h-32 rounded"
                    />
                  )}
                  {block.type === 'resource' && (
                    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-ink-300">
                      {block.text}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
