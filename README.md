<div align="center">

# ⚡ GLIDE

**Premium visual-first AI agent desktop automation command palette.**

Open-source. Electron + React + TypeScript. Built for fluid, fast, modern workflows.

</div>

---

## What is Glide?

Glide is a visual command center for your desktop. Press a global hotkey, get a beautifully minimal palette where you can:

- Talk to an AI agent in natural language.
- Trigger pre-built automations (post tweets, deploy to Vercel, sync GitHub PRs to Slack, open IDE projects).
- Wire up your own integrations through a clean, typed action API.

Think *n8n's depth, Vercel's polish, Raycast's speed* — wrapped in an aesthetic that respects your taste.

## Tech stack

| Layer | Tool |
|---|---|
| Desktop shell | Electron 33 |
| UI framework | React 18 + TypeScript (strict) |
| Bundler | electron-vite |
| Styling | Tailwind CSS 3 |
| Animation | Framer Motion |
| State | Zustand |

## Project structure

```
glide/
├── electron.vite.config.ts
├── src/
│   ├── main/           # Electron main process (window, IPC, globalShortcut)
│   │   ├── index.ts
│   │   ├── ipc/handlers.ts
│   │   └── actions/    # tweet, vscode, vercel, slack, github
│   ├── preload/        # contextBridge — exposes typed glideAPI to renderer
│   │   ├── index.ts
│   │   └── index.d.ts
│   ├── shared/         # shared TS types between main & renderer
│   │   └── ipc.ts
│   └── renderer/       # React UI
│       ├── App.tsx
│       ├── components/ # Shell, CommandInput, ResultList, etc.
│       ├── store/      # Zustand store
│       ├── lib/        # command registry, types
│       └── styles/
└── tailwind.config.ts
```

## Getting started

```bash
# Install
npm install

# Run in dev (hot reload main + preload + renderer)
npm run dev

# Type-check everything
npm run typecheck

# Build production bundle
npm run build

# Package native installer
npm run package
```

## Hotkeys

| Key | Action |
|---|---|
| `Cmd/Ctrl + Space` | Toggle Glide palette |
| `Esc` | Hide palette |
| `↑ / ↓` | Move selection |
| `Enter` | Run highlighted action |
| `Cmd/Ctrl + D / E / V / P / L` | Quick action shortcuts |

## Adding an action

Actions are pure TypeScript modules. Each exports a typed handler invoked over IPC.

```ts
// src/main/actions/my-action.ts
import type { ActionResult } from '@shared/ipc';

export async function runMyAction(payload: { text: string }): Promise<ActionResult> {
  // do work here
  return { ok: true, message: 'Done.' };
}
```

Then register it in `src/main/ipc/handlers.ts` and add a command entry in
`src/renderer/lib/commands.ts`.

## Design language

- **Vercel-grade minimalism.** Negative space, hairline borders, crisp typography.
- **Mint-neon accents.** A single signature accent (`#1FE39A`) used surgically — focus rings, active states, the pulse dot.
- **Motion as feedback.** Every state change is animated through Framer Motion spring physics — never linear, never abrupt.
- **Dark by default.** Deep, near-black neutrals with subtle hairline highlights.

## License

[MIT](./LICENSE) — do whatever, just keep the notice.
