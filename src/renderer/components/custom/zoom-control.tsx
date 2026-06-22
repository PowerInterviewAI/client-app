import { RefreshCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCombo } from '@/lib/hotkeys';

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
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomReset}
            aria-label="Reset zoom"
            title="Reset zoom"
            className="h-7 w-16 flex items-center justify-center rounded hover:bg-muted"
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="ml-1 text-xs">{zoomPercent}%</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reset zoom ({formatCombo('0')})</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom in ({formatCombo('=')})</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Zoom out ({formatCombo('-')})</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
