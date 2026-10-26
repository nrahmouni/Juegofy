import { useCallback, useRef, useState } from 'react';

export type TrailDot = { id: number; x: number; y: number };

/**
 * Pointer drag helpers + sparkle trail for kid drag-and-drop.
 */
export function useDragWithTrail() {
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const idRef = useRef(0);
  const active = useRef(false);

  const start = useCallback((x: number, y: number) => {
    active.current = true;
    setDragging(true);
    setPos({ x, y });
    setTrail([{ id: idRef.current++, x, y }]);
  }, []);

  const move = useCallback((x: number, y: number) => {
    if (!active.current) return;
    setPos({ x, y });
    setTrail((t) => {
      const next = [...t, { id: idRef.current++, x, y }];
      return next.slice(-12);
    });
  }, []);

  const end = useCallback(() => {
    active.current = false;
    setDragging(false);
    setPos(null);
    setTimeout(() => setTrail([]), 200);
  }, []);

  const TrailLayer = useCallback(() => {
    if (!trail.length) return null;
    return (
      // eslint-disable-next-line react/jsx-no-useless-fragment
      <>
        {trail.map((d, i) => (
          <div
            key={d.id}
            className="pointer-events-none fixed z-[170] text-sm"
            style={{
              left: d.x,
              top: d.y,
              transform: 'translate(-50%, -50%)',
              opacity: (i + 1) / trail.length,
            }}
          >
            ✨
          </div>
        ))}
      </>
    );
  }, [trail]);

  return { dragging, pos, trail, start, move, end, TrailLayer };
}
