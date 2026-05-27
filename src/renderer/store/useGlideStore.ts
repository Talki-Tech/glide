import { create } from 'zustand';
import type { ActionResult, ChatMessage, SystemStatus } from '../../shared/ipc';

export type ViewMode = 'palette' | 'chat' | 'settings';

export type AccentColor = 'mint' | 'cyan' | 'violet' | 'amber';

export interface GlideSettings {
  accent: AccentColor;
  hotkey: string;
  launchOnStartup: boolean;
  reduceMotion: boolean;
  integrations: {
    x: boolean;
    github: boolean;
    slack: boolean;
    vercel: boolean;
    vscode: boolean;
  };
}

const DEFAULT_SETTINGS: GlideSettings = {
  accent: 'mint',
  hotkey: 'Ctrl+Space',
  launchOnStartup: false,
  reduceMotion: false,
  integrations: {
    x: true,
    github: true,
    slack: true,
    vercel: true,
    vscode: true,
  },
};

const SETTINGS_KEY = 'glide.settings.v1';

function loadSettings(): GlideSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(s: GlideSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* storage disabled — silently ignore */
  }
}

interface GlideState {
  /* ----- input ----- */
  query: string;
  setQuery(q: string): void;

  /* ----- selection ----- */
  selectedIndex: number;
  setSelectedIndex(i: number): void;
  moveSelection(delta: number, total: number): void;

  /* ----- view ----- */
  view: ViewMode;
  setView(v: ViewMode): void;

  /* ----- chat ----- */
  messages: ChatMessage[];
  appendMessage(m: ChatMessage): void;
  isAssistantTyping: boolean;
  setAssistantTyping(b: boolean): void;

  /* ----- system ----- */
  status: SystemStatus;
  setStatus(s: SystemStatus): void;

  /* ----- toast (last action result) ----- */
  lastResult: ActionResult | null;
  setLastResult(r: ActionResult | null): void;

  /* ----- settings ----- */
  settings: GlideSettings;
  updateSettings(patch: Partial<GlideSettings>): void;
  toggleIntegration(key: keyof GlideSettings['integrations']): void;
  resetSettings(): void;
}

const initialStatus: SystemStatus = {
  llm: 'Claude-Opus-4.7',
  connectedServices: 12,
  online: true,
};

export const useGlideStore = create<GlideState>((set) => ({
  query: '',
  setQuery: (q) => set({ query: q, selectedIndex: 0 }),

  selectedIndex: 0,
  setSelectedIndex: (i) => set({ selectedIndex: i }),
  moveSelection: (delta, total) =>
    set((s) => {
      if (total === 0) return { selectedIndex: 0 };
      const next = (s.selectedIndex + delta + total) % total;
      return { selectedIndex: next };
    }),

  view: 'palette',
  setView: (v) => set({ view: v }),

  messages: [],
  appendMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  isAssistantTyping: false,
  setAssistantTyping: (b) => set({ isAssistantTyping: b }),

  status: initialStatus,
  setStatus: (s) => set({ status: s }),

  lastResult: null,
  setLastResult: (r) => set({ lastResult: r }),

  settings: loadSettings(),
  updateSettings: (patch) =>
    set((s) => {
      const next = { ...s.settings, ...patch };
      persistSettings(next);
      return { settings: next };
    }),
  toggleIntegration: (key) =>
    set((s) => {
      const next = {
        ...s.settings,
        integrations: {
          ...s.settings.integrations,
          [key]: !s.settings.integrations[key],
        },
      };
      persistSettings(next);
      return { settings: next };
    }),
  resetSettings: () =>
    set(() => {
      persistSettings(DEFAULT_SETTINGS);
      return { settings: DEFAULT_SETTINGS };
    }),
}));
