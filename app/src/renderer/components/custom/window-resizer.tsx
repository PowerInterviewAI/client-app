import { useCallback } from 'react';

function cursorForEdge(edge: string) {
  switch (edge) {
    case 'left':
    case 'right':
      return 'ew-resize';
    case 'top':
    case 'bottom':
      return 'ns-resize';
    case 'top-left':
    case 'bottom-right':
      return 'nwse-resize';
    case 'top-right':
    case 'bottom-left':
      return 'nesw-resize';
    default:
      return 'default';
  }
}

export default function WindowResizer() {
  const startDrag = useCallback((e: React.MouseEvent, edge: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let lastX = startX;
    let lastY = startY;

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - lastX;
      const dy = ev.clientY - lastY;
      lastX = ev.clientX;
      lastY = ev.clientY;
      try {
        const api = window.electronAPI;
        if (api?.resizeWindowDelta) api.resizeWindowDelta(dx, dy, edge);
      } catch (err) {
        console.error('Failed to resize window:', err);
      }
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // eslint-disable-next-line
      window.removeEventListener('mouseleave', onUp as any);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    // eslint-disable-next-line
    window.addEventListener('mouseleave', onUp as any);
  }, []);

  // render selected edge grips (only right/bottom/bottom-right)
  return (
    <div className="pointer-events-none fixed inset-0 z-9999">
      {/* Edges: keep only right and bottom */}
      <div
        onMouseDown={(e) => startDrag(e, 'right')}
        // eslint-disable-next-line
        style={{ cursor: cursorForEdge('right'), WebkitAppRegion: 'no-drag' } as any}
        className="pointer-events-auto absolute top-0 bottom-0 right-0 w-2"
      />
      <div
        onMouseDown={(e) => startDrag(e, 'bottom')}
        // eslint-disable-next-line
        style={{ cursor: cursorForEdge('bottom'), WebkitAppRegion: 'no-drag' } as any}
        className="pointer-events-auto absolute left-0 right-0 bottom-0 h-2"
      />

      {/* Corner: keep only bottom-right with dots indicator */}
      <div
        onMouseDown={(e) => startDrag(e, 'bottom-right')}
        // eslint-disable-next-line
        style={{ cursor: cursorForEdge('bottom-right'), WebkitAppRegion: 'no-drag' } as any}
        className="pointer-events-auto absolute bottom-0 right-0 w-4 h-4 flex items-end justify-end p-1"
      >
        {/* diagonal dots to show draggable corner */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 4 4"
          fill="none"
          className="text-gray-500 -mr-0.5"
        >
          <circle cx="1" cy="3" r="0.5" fill="currentColor" />
          <circle cx="2" cy="2" r="0.5" fill="currentColor" />
          <circle cx="3" cy="1" r="0.5" fill="currentColor" />
          <circle cx="3" cy="3" r="0.5" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
