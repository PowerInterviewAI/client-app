import { RefreshCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useT } from '@/i18n';
import { formatCombo } from '@/lib/hotkeys';
import { cn } from '@/lib/utils';

import { BAR_GHOST, BAR_ICON_BUTTON } from './control-panel/bar';

export default function ZoomControl() {
  const t = useT();
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
            aria-label={t.zoomControl.reset}
            title={t.zoomControl.reset}
            className={cn(
              'h-8 px-2 flex items-center justify-center rounded-lg tabular-nums',
              BAR_GHOST
            )}
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="ml-1 text-xs">{zoomPercent}%</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t.common.withCombo(t.zoomControl.reset, formatCombo('0'))}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomIn}
            aria-label={t.zoomControl.zoomIn}
            title={t.zoomControl.zoomIn}
            className={cn(BAR_ICON_BUTTON, BAR_GHOST, 'flex items-center justify-center')}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t.common.withCombo(t.zoomControl.zoomIn, formatCombo('='))}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomOut}
            aria-label={t.zoomControl.zoomOut}
            title={t.zoomControl.zoomOut}
            className={cn(BAR_ICON_BUTTON, BAR_GHOST, 'flex items-center justify-center')}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t.common.withCombo(t.zoomControl.zoomOut, formatCombo('-'))}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
