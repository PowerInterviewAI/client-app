import { Captions, CaptionsOff, Keyboard, ListChecks, Route } from 'lucide-react';
import { useEffect, useState } from 'react';

import CreditsDisplay from '@/components/custom/credits-display';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSuggestionMode } from '@/hooks/use-suggestion-mode';
import { useTranscriptPanel } from '@/hooks/use-transcript-panel';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';
import { cn } from '@/lib/utils';
import { RunningState, UserRole } from '@/types/app-state';

import { HotkeyCheatsheetDialog } from './hotkey-cheatsheet';
import { RunningIndicator } from './running-indicator';

/**
 * Renderer-local, not a registered Hotkey: it only needs to work while this window has focus,
 * unlike the globalShortcut-backed ones in lib/hotkeys.ts that must also fire in stealth mode.
 */
function useHotkeyCheatsheetShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      e.preventDefault();
      onOpen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}

interface StatusPanelProps {
  runningState: RunningState;
  credits: number;
  llmModel: string;
  userRole?: UserRole;
}

// Filled background rather than a text-color tint: a tint against this panel's muted-foreground
// default read as nearly invisible, the same problem the control-panel toggle button had.
const badgeClass = (active: boolean) =>
  cn(
    'h-6 flex items-center gap-1 rounded px-2 text-xs font-medium',
    active ? 'bg-primary/80 text-primary-foreground' : 'text-muted-foreground'
  );

export default function StatusPanel({
  runningState,
  llmModel,
  credits,
  userRole,
}: StatusPanelProps) {
  // calculate and formatting handled by CreditsDisplay component
  const { hintOnly } = useSuggestionMode();
  const { visible: transcriptVisible } = useTranscriptPanel();
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  useHotkeyCheatsheetShortcut(() => setHotkeysOpen(true));

  return (
    <div id="status-panel" className="flex items-center justify-between text-muted-foreground p-1">
      <RunningIndicator runningState={runningState} />
      <CreditsDisplay credits={credits} llmModel={llmModel} userRole={userRole} className="ml-2" />
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('ml-2', badgeClass(hintOnly))}>
            {hintOnly ? (
              <ListChecks className="h-3.5 w-3.5" />
            ) : (
              <Route className="h-3.5 w-3.5 -scale-y-100" />
            )}
            {hintOnly ? 'Hint-only' : 'Full sentences'}
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>
          <p>
            {hintOnly ? 'Hint-only mode' : 'Full-sentence mode'} (
            {HOTKEYS[Hotkey.ToggleSuggestionMode].combo})
          </p>
          <p className="text-xs text-muted-foreground">
            {hintOnly ? 'Headline + keyword bullets' : 'Answers written out in full'}
          </p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('ml-1', badgeClass(transcriptVisible))}>
            {transcriptVisible ? (
              <Captions className="h-3.5 w-3.5" />
            ) : (
              <CaptionsOff className="h-3.5 w-3.5" />
            )}
            Transcript
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>
          <p>
            Transcription: {transcriptVisible ? 'Shown' : 'Hidden'} (
            {HOTKEYS[Hotkey.ToggleTranscript].combo})
          </p>
        </TooltipContent>
      </Tooltip>
      <div className="flex-1" />
      <button
        className="h-6 flex items-center justify-center rounded hover:bg-muted text-xs font-medium gap-1 px-2"
        aria-label="Show keyboard shortcuts"
        title="Show keyboard shortcuts (?)"
        onClick={() => setHotkeysOpen(true)}
      >
        <Keyboard className="h-4 w-4" /> Show Hotkeys
      </button>
      <HotkeyCheatsheetDialog open={hotkeysOpen} onOpenChange={setHotkeysOpen} />
    </div>
  );
}
