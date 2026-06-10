'use client';

import { createStaticStyles, cssVar } from 'antd-style';
import {
  type CSSProperties,
  memo,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const CARD_WIDTH = 400;
const MARGIN = 24;
const TOP_GAP = 120;
const MAX_HEIGHT = 640;

const styles = createStaticStyles(({ css }) => ({
  card: css`
    position: fixed;
    z-index: 1000;

    overflow: hidden;
    display: flex;
    flex-direction: column;

    width: ${CARD_WIDTH}px;
    height: min(${MAX_HEIGHT}px, calc(100vh - ${TOP_GAP}px));
    border: 1px solid color-mix(in srgb, ${cssVar.colorBorder} 70%, transparent);
    border-radius: 16px;

    background: ${cssVar.colorBgElevated};
    box-shadow:
      0 24px 60px rgb(15 23 42 / 22%),
      0 4px 12px rgb(15 23 42 / 10%);
  `,
}));

interface Position {
  left: number;
  top: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, Math.max(min, max)));

const FloatingCard = memo<{ children: ReactNode }>(({ children }) => {
  const [pos, setPos] = useState<Position>();
  const posRef = useRef<Position | undefined>(undefined);
  posRef.current = pos;
  const dragRef = useRef<{
    originX: number;
    originY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const getBounds = () => {
    const height = Math.min(MAX_HEIGHT, window.innerHeight - TOP_GAP);
    return {
      maxLeft: window.innerWidth - CARD_WIDTH - MARGIN,
      maxTop: window.innerHeight - height - MARGIN,
    };
  };

  // Anchor bottom-right on mount; keep within the viewport on resize.
  useLayoutEffect(() => {
    const place = () => {
      const { maxLeft, maxTop } = getBounds();
      setPos((current) =>
        current
          ? { left: clamp(current.left, MARGIN, maxLeft), top: clamp(current.top, MARGIN, maxTop) }
          : { left: Math.max(MARGIN, maxLeft), top: Math.max(MARGIN, maxTop) },
      );
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-copilot-drag-handle]')) return;
    // Don't start a drag when grabbing an interactive control in the header.
    if (target.closest('button, a, input, textarea, [role="menuitem"]')) return;

    const start = posRef.current;
    if (!start) return;

    dragRef.current = {
      originX: event.clientX,
      originY: event.clientY,
      startLeft: start.left,
      startTop: start.top,
    };

    const onMove = (moveEvent: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { maxLeft, maxTop } = getBounds();
      setPos({
        left: clamp(drag.startLeft + (moveEvent.clientX - drag.originX), MARGIN, maxLeft),
        top: clamp(drag.startTop + (moveEvent.clientY - drag.originY), MARGIN, maxTop),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  if (!pos) return null;

  return (
    <div
      className={styles.card}
      style={{ left: pos.left, top: pos.top } as CSSProperties}
      onPointerDown={handlePointerDown}
    >
      {children}
    </div>
  );
});

FloatingCard.displayName = 'FloatingCard';

export default FloatingCard;
