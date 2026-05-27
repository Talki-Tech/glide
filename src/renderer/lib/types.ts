import type { ComponentType, SVGProps } from 'react';
import type { ActionResult } from '../../shared/ipc';

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** A single row in the result list. */
export interface CommandEntry {
  id: string;
  label: string;
  /** Optional secondary line under the label. */
  description?: string;
  /** Keyboard shortcut shown on the right (e.g. "⌘D"). */
  shortcut?: string;
  Icon: IconComponent;
  /** "primary" gets the mint card treatment; others stay neutral. */
  emphasis?: 'primary' | 'default';
  /** Returns a normalized ActionResult — invoked on Enter/click. */
  run(): Promise<ActionResult>;
  /** Keyword index for fuzzy matching. */
  keywords?: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  /** Fired when the chip is clicked. */
  run(): Promise<ActionResult | void>;
}
