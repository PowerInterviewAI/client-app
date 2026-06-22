import { EyeOff, Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import faviconSvg from '/favicon.svg';
import CreditsDisplay from '@/components/custom/credits-display';
import DocumentationDialog from '@/components/custom/documentation-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { useConfigStore } from '@/hooks/use-config-store';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useThemeStore } from '@/hooks/use-theme-store';
import { APP_NAME } from '@/lib/consts';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';
import { getElectron } from '@/lib/utils';

// WebkitAppRegion is an Electron-specific CSS property not included in React.CSSProperties
type DragStyle = React.CSSProperties & { WebkitAppRegion: 'drag' | 'no-drag' };
const DRAG: DragStyle = { WebkitAppRegion: 'drag' };
const NO_DRAG: DragStyle = { WebkitAppRegion: 'no-drag' };

const isMac = navigator.platform.toUpperCase().includes('MAC');

// Traffic lights span x=7..59 logical px (3×12px buttons + 2×8px gaps + 7px offset).
// We keep 72 logical px clear (59px buttons + 13px breathing room).
// CSS padding = 72 / zoomFactor so it stays 72 logical px at any zoom level.
const TRAFFIC_LIGHT_LOGICAL_CLEAR = 72;

export default function Titlebar() {
  const isStealth = useIsStealthMode();

  const [zoomFactor, setZoomFactor] = useState(1);
  useEffect(() => {
    if (!isMac) return;
    const electron = getElectron();
    if (!electron) return;
    electron.zoom
      .getFactor()
      .then(setZoomFactor)
      .catch(() => {});
    return electron.zoom.onChange((percent) => setZoomFactor(percent / 100));
  }, []);

  const macPaddingLeft = isMac ? Math.ceil(TRAFFIC_LIGHT_LOGICAL_CLEAR / zoomFactor) : undefined;

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

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
  const { config } = useConfigStore();
  const { isDark, toggleTheme } = useThemeStore();

  if (isStealth) return null;

  return (
    <>
      <div
        id="titlebar"
        style={{ ...DRAG, paddingLeft: macPaddingLeft }}
        className="flex items-center gap-3 h-9 pr-1 pl-1 select-none bg-card border-b border-border"
      >
        <div className="flex flex-1 items-center gap-2 px-1">
          {!isMac && (
            <>
              <img src={faviconSvg} alt="logo" className="h-5 w-5" />
              <div className="text-sm font-medium" style={DRAG}>
                {APP_NAME}
              </div>
            </>
          )}
        </div>

        {appState?.isLoggedIn && appState?.credits !== undefined && (
          <CreditsDisplay
            credits={appState.credits ?? 0}
            llmModel={config?.llmConf?.model ?? appState.providedLLMModel ?? ''}
            style={DRAG}
          />
        )}

        <div className="ml-auto flex items-center gap-1" style={NO_DRAG}>
          {appState?.isLoggedIn && appState?.credits !== undefined && (
            <>
              <hr className="h-6 border border-border" />
            </>
          )}

          {appState?.isLoggedIn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleStealth}
                  aria-label="Toggle stealth mode"
                  title="Toggle stealth mode"
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
                  style={NO_DRAG}
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle stealth mode ({HOTKEYS[Hotkey.ToggleStealth].combo})</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
                style={NO_DRAG}
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
                style={NO_DRAG}
              >
                <span className="font-medium">?</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Documentation</p>
            </TooltipContent>
          </Tooltip>

          {!isMac && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleMinimize}
                    aria-label="Minimize"
                    className="h-7 w-8 flex items-center justify-center rounded hover:bg-muted"
                    style={NO_DRAG}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M5 12h14" strokeLinecap="round" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Minimize</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleMaximize}
                    aria-label="Maximize"
                    className="h-7 w-8 flex items-center justify-center rounded hover:bg-muted"
                    style={NO_DRAG}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <rect x="4" y="4" width="16" height="16" rx="1" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximize</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="h-7 w-8 flex items-center justify-center rounded hover:bg-destructive/50"
                style={NO_DRAG}
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
