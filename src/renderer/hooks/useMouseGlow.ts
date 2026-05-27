import { useCallback, useRef, useState } from 'react';

/**
 * Tracks the cursor position relative to an element, returning normalized
 * (x, y) for use in a radial gradient — the soft blurred glow effect on
 * list-item hover. Updates only while pointer is over the element.
 */
export function useMouseGlow() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const onLeave = useCallback(() => setPos(null), []);

  return { ref, pos, onMove, onLeave };
}
