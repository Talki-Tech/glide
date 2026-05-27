import type { GlideAPI } from './index';

declare global {
  interface Window {
    /** The contextBridge surface — see src/preload/index.ts. */
    glide: GlideAPI;
  }
}

export {};
