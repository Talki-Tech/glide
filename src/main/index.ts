import { app, BrowserWindow, globalShortcut, screen, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { registerIpcHandlers } from './ipc/handlers.js';
import { IpcChannels, type SystemStatus } from '../shared/ipc.js';
import { mcpManager } from './mcp/McpManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Singleton reference to the palette window. */
let paletteWindow: BrowserWindow | null = null;

const WINDOW_WIDTH = 920;
const WINDOW_HEIGHT = 620;

function createPaletteWindow(): BrowserWindow {
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;

  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: Math.round((screenWidth - WINDOW_WIDTH) / 2),
    y: Math.round(screenHeight * 0.18),
    show: false,
    frame: false,
    transparent: false,
    resizable: true,
    movable: true,
    minWidth: 760,
    minHeight: 520,
    maximizable: true,
    minimizable: true,
    skipTaskbar: false,
    alwaysOnTop: false,
    fullscreenable: false,
    hasShadow: true,
    roundedCorners: false,
    backgroundColor: '#0A0B0D',
    title: 'Glide',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: !app.isPackaged,
    },
  });

  // electron-vite injects dev server URL in dev, output path in prod.
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.on('closed', () => {
    paletteWindow = null;
  });

  return win;
}

function togglePalette(): void {
  if (!paletteWindow) {
    paletteWindow = createPaletteWindow();
    paletteWindow.once('ready-to-show', () => paletteWindow?.show());
    return;
  }
  if (paletteWindow.isVisible()) {
    paletteWindow.hide();
  } else {
    paletteWindow.show();
    paletteWindow.focus();
  }
}

function registerGlobalShortcuts(): void {
  const accelerator = process.platform === 'darwin' ? 'Command+Space' : 'Control+Space';
  const ok = globalShortcut.register(accelerator, togglePalette);
  if (!ok) {
    // Some platforms (macOS Spotlight) own Cmd+Space; fall back gracefully.
    const fallback = process.platform === 'darwin' ? 'Command+Shift+Space' : 'Control+Shift+Space';
    globalShortcut.register(fallback, togglePalette);
  }
}

function publishStatus(): void {
  if (!paletteWindow) return;
  const connected = mcpManager.listServers().filter((s) => s.status === 'connected').length;
  const status: SystemStatus = {
    llm: 'Claude-Opus-4.7',
    connectedServices: connected,
    online: true,
  };
  paletteWindow.webContents.send(IpcChannels.SystemStatus, status);
}

app.whenReady().then(async () => {
  registerIpcHandlers();

  // Connect to all configured MCP servers before showing the window.
  mcpManager.init().catch((e) => console.error('[MCP] init error:', e));

  // Window controls from renderer
  ipcMain.on(IpcChannels.WindowHide, () => paletteWindow?.hide());
  ipcMain.on(IpcChannels.WindowToggle, () => togglePalette());
  ipcMain.on(IpcChannels.WindowMinimize, () => paletteWindow?.minimize());
  ipcMain.on(IpcChannels.WindowMaximize, () => {
    if (!paletteWindow) return;
    if (paletteWindow.isMaximized()) paletteWindow.unmaximize();
    else paletteWindow.maximize();
  });
  ipcMain.on(IpcChannels.WindowClose, () => paletteWindow?.close());

  paletteWindow = createPaletteWindow();
  paletteWindow.once('ready-to-show', () => {
    paletteWindow?.show();
    publishStatus();
  });

  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      paletteWindow = createPaletteWindow();
      paletteWindow.once('ready-to-show', () => paletteWindow?.show());
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  mcpManager.shutdown().catch(() => {});
});

app.on('window-all-closed', () => {
  // Stay alive — palette is meant to live in background and pop on hotkey.
  if (process.platform !== 'darwin') {
    // On non-mac, exit when fully closed for now (single-window UX).
    app.quit();
  }
});
