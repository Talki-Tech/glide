import type { GlideAPI } from '../preload/index';

/**
 * Augments `window` in the renderer so TypeScript knows about the
 * preload-exposed bridge. The runtime injection happens in
 * src/preload/index.ts via contextBridge.exposeInMainWorld.
 */
declare global {
  interface Window {
    glide: GlideAPI;
  }
}

export {};
