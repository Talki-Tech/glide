import { safeStorage } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { LlmProviderConfigs } from '../../shared/llm.js';

const KEY_STORE_PATH = path.join(os.homedir(), '.glide', 'llm-keys.enc');

/**
 * Persist LLM provider configs to disk.
 * API keys are encrypted via Electron safeStorage (OS keychain-backed).
 * Non-sensitive fields (defaultModel) stored as plain JSON alongside.
 */
export function saveConfigs(configs: LlmProviderConfigs): void {
  try {
    const dir = path.dirname(KEY_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (safeStorage.isEncryptionAvailable()) {
      // Encrypt the whole configs blob
      const json = JSON.stringify(configs);
      const encrypted = safeStorage.encryptString(json);
      fs.writeFileSync(KEY_STORE_PATH, encrypted);
    } else {
      // Fallback: store as plain JSON (warn but don't crash)
      console.warn('[keyStore] safeStorage not available — storing keys unencrypted');
      fs.writeFileSync(KEY_STORE_PATH + '.plain', JSON.stringify(configs, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[keyStore] Failed to save configs:', err);
  }
}

export function loadConfigs(): LlmProviderConfigs {
  try {
    if (safeStorage.isEncryptionAvailable() && fs.existsSync(KEY_STORE_PATH)) {
      const encrypted = fs.readFileSync(KEY_STORE_PATH);
      const json = safeStorage.decryptString(encrypted);
      return JSON.parse(json) as LlmProviderConfigs;
    }

    // Plaintext fallback
    const plainPath = KEY_STORE_PATH + '.plain';
    if (fs.existsSync(plainPath)) {
      const raw = fs.readFileSync(plainPath, 'utf-8');
      return JSON.parse(raw) as LlmProviderConfigs;
    }
  } catch (err) {
    console.error('[keyStore] Failed to load configs:', err);
  }
  return {};
}
