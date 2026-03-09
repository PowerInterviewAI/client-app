import { EyeOff, Moon, RefreshCcw, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';

import faviconSvg from '/favicon.svg';
import CreditsDisplay from '@/components/custom/credits-display';
import DocumentationDialog from '@/components/custom/documentation-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useThemeStore } from '@/hooks/use-theme-store';
import { getElectron } from '@/lib/utils';

export default function Titlebar() {
  const isStealth = useIsStealthMode();

  const { isDark, toggleTheme } = useThemeStore();

  const handleClose = () => {
    const api = window.electronAPI;
    if (api?.close) api.close();
  };

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

  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const handleToggleStealth = () => {
    const electron = getElectron();
    if (electron) {
      electron.toggleStealth();
    } else {
      console.warn('Electron API not available for toggling stealth mode');
    }
  };

  const { appState } = useAppState();

  if (isStealth) return null;

  return (
    <>
      <div
        id="titlebar"
        // eslint-disable-next-line
        style={{ WebkitAppRegion: 'drag' } as any}
        className="flex items-center gap-3 h-9 px-1 select-none bg-card border-b border-border"
      >
        <div className="flex flex-1 items-center gap-2 px-1">
          <img src={faviconSvg} alt="logo" className="h-5 w-5" />

          <div
            className="text-sm font-medium"
            // eslint-disable-next-line
            style={{ WebkitAppRegion: 'drag' } as any}
          >
            Power Interview
          </div>
        </div>

        {appState?.isLoggedIn && appState?.credits !== undefined && (
          <CreditsDisplay
            credits={appState.credits!}
            // eslint-disable-next-line
            style={{ WebkitAppRegion: 'drag' } as any}
          />
        )}

        <div
          className="ml-auto flex items-center gap-1"
          // eslint-disable-next-line
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          {appState?.isLoggedIn && appState?.credits !== undefined && (
            <hr className="h-6 border border-border" />
          )}

          {/* zoom controls */}
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

          <hr className="h-6 border border-border" />

          {appState?.isLoggedIn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleStealth}
                  aria-label="Toggle stealth mode"
                  title="Toggle stealth mode"
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
                  // eslint-disable-next-line
                  style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle stealth mode (Ctrl+Shift+M)</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleTheme()}
                aria-label="Toggle theme"
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
                // eslint-disable-next-line
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDark ? 'Light mode' : 'Dark mode'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsDocsOpen(true)}
                aria-label="Documentation"
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
                // eslint-disable-next-line
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                <span className="font-medium">?</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Documentation</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="h-7 w-12 flex items-center justify-center rounded-lg hover:bg-destructive/50"
                // eslint-disable-next-line
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Close</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <DocumentationDialog open={isDocsOpen} onOpenChange={setIsDocsOpen} />
    </>
  );
}
