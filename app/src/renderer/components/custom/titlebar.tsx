import { EyeOff, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

import faviconSvg from '/favicon.svg';
import DocumentationDialog from '@/components/custom/documentation-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useThemeStore } from '@/hooks/use-theme-store';
import { CREDITS_PER_MINUTE } from '@/lib/consts';
import { cn, getElectron } from '@/lib/utils';

export default function Titlebar() {
  const isStealth = useIsStealthMode();

  const { isDark, toggleTheme } = useThemeStore();

  const handleClose = () => {
    const api = window.electronAPI;
    if (api?.close) api.close();
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
  const remainingCredits = appState?.credits ?? 0;
  const availableMinutes = Math.floor(remainingCredits / CREDITS_PER_MINUTE);
  const availableTime =
    availableMinutes <= 0
      ? remainingCredits > 0
        ? 'Less than 1 min'
        : 'No credits left'
      : `${availableMinutes.toLocaleString()} min${availableMinutes > 1 ? 's' : ''}`;

  if (isStealth) return null;

  return (
    <>
      <div
        id="titlebar"
        // eslint-disable-next-line
        style={{ WebkitAppRegion: 'drag' } as any}
        className="flex items-center gap-3 h-9 px-1 select-none bg-card border-b border-border"
      >
        <div className="flex items-center gap-2 px-1">
          <img src={faviconSvg} alt="logo" className="h-5 w-5" />

          <div
            className="text-sm font-medium"
            // eslint-disable-next-line
            style={{ WebkitAppRegion: 'drag' } as any}
          >
            Power Interview
          </div>
        </div>

        <div
          className="ml-auto flex items-center gap-1"
          // eslint-disable-next-line
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          {appState?.isLoggedIn && appState?.credits !== undefined && (
            <div
              className={cn(
                'text-xs font-bold mr-2',
                availableMinutes >= 5
                  ? 'text-muted-foreground'
                  : availableMinutes >= 1
                    ? 'text-yellow-600 animate-pulse'
                    : 'text-destructive animate-pulse'
              )}
              // eslint-disable-next-line
              style={{ WebkitAppRegion: 'drag' } as any}
            >
              {appState?.credits?.toLocaleString()} credits ({availableTime})
            </div>
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
              <p>Toggle theme</p>
            </TooltipContent>
          </Tooltip>

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
                <p>Toggle stealth</p>
              </TooltipContent>
            </Tooltip>
          )}

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
                className="h-7 w-12 flex items-center justify-center rounded hover:bg-destructive/50"
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
