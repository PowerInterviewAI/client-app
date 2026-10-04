import { useRef } from 'react';

import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface DockResizeHandleProps {
  /** current dock height in px */
  height: number;
  min: number;
  max: number;
  /** fires continuously while dragging - cheap, not persisted */
  onResize: (height: number) => void;
  /** fires on release, on a keyboard step, and with null on double-click to return to automatic */
  onCommit: (height: number | null) => void;
}

const KEY_STEP = 16;
const KEY_STEP_LARGE = 48;

/**
 * Drag handle sitting between the suggestion row and the transcription dock.
 *
 * Pointer events rather than mouse events, and `setPointerCapture` rather than window listeners:
 * capture keeps the drag attached to this element once it starts, so a fast drag that outruns the
 * pointer - or leaves the window entirely - still tracks and still ends cleanly.
 */
export default function DockResizeHandle({
  height,
  min,
  max,
  onResize,
  onCommit,
}: DockResizeHandleProps) {
  const t = useT();
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const clamp = (h: number) => Math.min(Math.max(Math.round(h), min), max);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // stops the drag from selecting the transcript text it passes over
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startHeight: height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    // the dock is below the handle, so dragging up has to make it taller
    onResize(clamp(drag.startHeight - (e.clientY - drag.startY)));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onCommit(height);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const next = clamp(height + (e.key === 'ArrowUp' ? step : -step));
    onResize(next);
    onCommit(next);
  };

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={t.panels.resizeTranscript}
      aria-valuenow={Math.round(height)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => onCommit(null)}
      title={t.panels.resizeHint}
      // touch-none keeps a pen or touch drag from scrolling the page instead of resizing
      className="group relative h-1.5 shrink-0 cursor-row-resize touch-none outline-none -my-0.5"
    >
      {/* The hit area is 6px because that is what is comfortable to grab; the line is 2px because
          that is what should be visible. Centred in the hit area so the two stay concentric. */}
      <div
        className={cn(
          'absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border transition-colors',
          'group-hover:bg-primary/50 group-focus-visible:bg-primary'
        )}
      />
    </div>
  );
}
