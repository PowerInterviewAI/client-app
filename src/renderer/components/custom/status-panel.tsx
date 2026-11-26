import { Captions, CaptionsOff, Keyboard, ListChecks, Route } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import CreditsDisplay from '@/components/custom/credits-display';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSuggestionMode } from '@/hooks/use-suggestion-mode';
import { useTranscriptPanel } from '@/hooks/use-transcript-panel';
import { useT } from '@/i18n';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';
import type { SubscriptionSummary } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

import { CompactHotkeyCheatsheet } from './hotkey-cheatsheet';
import { RunningIndicator } from './running-indicator';

interface StatusPanelProps {
  runningState: RunningState;
  credits: number;
  subscription: SubscriptionSummary;
  llmModel: string;
  creditsPerMinute?: number;
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
  subscription,
  creditsPerMinute,
}: StatusPanelProps) {
  const t = useT();
  // calculate and formatting handled by CreditsDisplay component
  const { hintOnly } = useSuggestionMode();
  const { visible: transcriptVisible } = useTranscriptPanel();
  const [hotkeysOpen, setHotkeysOpen] = useState(false);

  return (
    <div id="status-panel" className="flex items-center justify-between text-muted-foreground p-1">
      <RunningIndicator runningState={runningState} />
      <CreditsDisplay
        credits={credits}
        subscription={subscription}
        llmModel={llmModel}
        creditsPerMinute={creditsPerMinute}
        className="ml-2"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('ml-2', badgeClass(hintOnly))}>
            {hintOnly ? (
              <ListChecks className="h-3.5 w-3.5" />
            ) : (
              <Route className="h-3.5 w-3.5 -scale-y-100" />
            )}
            {hintOnly ? t.suggestionMode.hintOnlyBadge : t.suggestionMode.fullSentencesBadge}
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>
          <p>
            {t.common.withCombo(
              hintOnly ? t.suggestionMode.hintOnlyMode : t.suggestionMode.fullSentenceMode,
              HOTKEYS[Hotkey.ToggleSuggestionMode].combo
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {hintOnly ? t.suggestionMode.hintOnlySummary : t.suggestionMode.fullSentenceSummary}
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
            {t.statusPanel.transcript}
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>
          <p>
            {transcriptVisible
              ? t.statusPanel.transcriptionShown(HOTKEYS[Hotkey.ToggleTranscript].combo)
              : t.statusPanel.transcriptionHidden(HOTKEYS[Hotkey.ToggleTranscript].combo)}
          </p>
        </TooltipContent>
      </Tooltip>
      <div className="flex-1" />
      {/* Opened by hover, not click. This panel only renders in stealth, where the window ignores
          clicks and cannot take focus - only forwarded mouse moves reach it. The overlay is
          pointer-events-none so the trigger keeps its hover underneath it; a real modal overlay
          would take the hover, close the panel, and reopen it on the next mouse move. */}
      <div
        className="h-6 flex items-center justify-center rounded hover:bg-muted text-xs font-medium gap-1 px-2"
        aria-label={t.statusPanel.showHotkeysLabel}
        onMouseEnter={() => setHotkeysOpen(true)}
        onMouseLeave={() => setHotkeysOpen(false)}
      >
        <Keyboard className="h-4 w-4" /> {t.statusPanel.showHotkeys}
      </div>
      {hotkeysOpen &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 animate-in fade-in-0">
            <div className="surface-overlay text-popover-foreground w-full max-w-2xl max-h-full overflow-hidden rounded-xl p-3 animate-in zoom-in-95">
              <h3 className="mb-2 text-sm font-semibold">{t.hotkeys.dialogTitle}</h3>
              <CompactHotkeyCheatsheet />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
