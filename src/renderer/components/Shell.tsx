import type { ReactNode } from 'react';
import { TitleBar } from './TitleBar';

interface ShellProps {
  children: ReactNode;
}

/**
 * App shell. Solid Windows window: titlebar with native-style
 * controls on top, content fills the rest. No transparency,
 * no rounded corners — opaque app surface.
 */
export function Shell({ children }: ShellProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-ink-900 text-ink-100">
      <TitleBar />
      {children}
    </div>
  );
}
