import { RefreshCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Render the set of zoom buttons that live in the titlebar.
 *
 * This component handles its own state (current zoom percent) and
 * communicates with the preload/electron API directly.  The
 * parent (Titlebar) simply places the controls in the layout and
 * is free to show/hide an enclosing divider if necessary.
 */
export default function ZoomControl() {
  const [zoomPercent, setZoomPercent] = useState(100);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.zoom) return;

    api.zoom
      .getFactor()
      .then((f) => setZoomPercent(Math.round(f * 100)))
      .catch(() => {});

    const cleanup = api.zoom.onChange((p) => setZoomPercent(p));
    return cleanup;
  }, []);

  const handleZoomIn = () => {
    window.electronAPI?.zoom.increase();
  };

  const handleZoomOut = () => {
    window.electronAPI?.zoom.decrease();
  };

  const handleZoomReset = () => {
    window.electronAPI?.zoom.reset();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
            // eslint-disable-next-line
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom in (Ctrl+Shift+=)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
            // eslint-disable-next-line
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom out (Ctrl+Shift+-)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomReset}
            aria-label="Reset zoom"
            title="Reset zoom"
            className="h-7 w-14 flex items-center justify-center rounded hover:bg-muted"
            // eslint-disable-next-line
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="ml-1 text-xs">{zoomPercent}%</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reset zoom (Ctrl+Shift+0)</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
}
