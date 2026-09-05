import {
  Camera,
  Captions,
  CaptionsOff,
  FileText,
  Hash,
  ImageOff,
  Loader,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { showExportSuccessToast } from '@/components/custom/export-success-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { useSaveHistoryGuard } from '@/hooks/use-save-history-guard';
import useTools from '@/hooks/use-tools';
import { useTranscriptPanel } from '@/hooks/use-transcript-panel';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';
import { cn, getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';
import type { ExportFormat } from '@/types/export';

import { BAR_ACTIVE, BAR_GHOST, BAR_ICON_BUTTON } from './bar';

interface ToolsGroupProps {
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

export function ToolsGroup({ getDisabled }: ToolsGroupProps) {
  const { runningState, appState } = useAppState();
  const { exporting, exportTranscript, exportMockReport, clearAll, setPlaceholderData } = useTools();
  const { visible: transcriptVisible, toggle: onToggleTranscript } = useTranscriptPanel();
  const { confirmDiscard } = useSaveHistoryGuard();
  const [clearing, setClearing] = useState(false);
  // One flag rather than three: capture/clear-images/trigger all reach the same main-process
  // action-suggestion service serially, so overlapping calls would race each other for no benefit.
  const [actionBusy, setActionBusy] = useState(false);

  const runActionSuggestion = async (
    action: () => Promise<void> | undefined,
    failureMessage: string
  ) => {
    setActionBusy(true);
    try {
      await action();
    } catch (error) {
      console.error(error);
      toast.error(failureMessage);
    } finally {
      setActionBusy(false);
    }
  };

  const onClear = async () => {
    // Asked before the spinner goes up, and a no-op when there is nothing but placeholder copy
    // to lose. The transcript and the suggestions exist only in main-process memory.
    if (!(await confirmDiscard('clear'))) return;

    setClearing(true);
    try {
      // Placeholder state only rewrites what the renderer sees. The service buffers keep the
      // real transcripts and suggestions until clearAll drops them, so Clear has to do both.
      await clearAll();
      await setPlaceholderData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to clear');
    } finally {
      setClearing(false);
    }
  };

  // Nothing recorded yet. Checked here as well as in the service, and this is the copy the user
  // actually reads: an error thrown out of an ipcMain handler reaches the renderer wrapped in
  // Electron's "Error invoking remote method 'tools:export-transcript'" prefix, which is not a
  // sentence to put in front of someone. The service keeps its own guard because it is what
  // stops the billed summarize call, and this state can be stale by a broadcast.
  //
  // On `hasHistory` rather than on the array lengths, which are never zero: the panels carry
  // placeholder copy on launch and again after every Clear, so the old check let a summarize
  // request be billed for a document about "Transcripts will be here".
  //
  // Subject dispatch mirrors save-history-dialog.tsx: a finished mock session's report can still
  // be sitting unexported when the candidate is back on this bar (nothing forces a return to
  // `/main` through Clear), and this button calling `exportTranscript` unconditionally in that
  // state said "nothing to export" over real, unsaved mock content instead of exporting it.
  const isMockSubject = appState?.hasMockContent === true && appState?.hasHistory !== true;
  const nothingToExport = !appState?.hasHistory && !appState?.hasMockContent;

  const onExportTranscript = async (format: ExportFormat) => {
    if (nothingToExport) {
      toast.error('There is nothing to export yet', {
        description: 'Run an interview first, then export the transcript and suggestions.',
      });
      return;
    }

    try {
      const filePath = isMockSubject
        ? await exportMockReport(format)
        : await exportTranscript(format);
      if (!filePath) return;
      showExportSuccessToast(filePath, format);
    } catch (error) {
      console.error(error);
      // The message when there is nothing to export names the reason, and a generic "failed"
      // over it would send the user looking for a fault that is not there.
      toast.error(error instanceof Error ? error.message : 'Failed to export interview');
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* View-only preference, so it stays available while the assistant runs */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={onToggleTranscript}
            size="sm"
            className={cn(BAR_ICON_BUTTON, transcriptVisible ? BAR_ACTIVE : BAR_GHOST)}
            aria-pressed={transcriptVisible}
            aria-label={transcriptVisible ? 'Hide transcription' : 'Show transcription'}
          >
            {transcriptVisible ? (
              <Captions className="h-4 w-4" />
            ) : (
              <CaptionsOff className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {transcriptVisible ? 'Hide Transcription' : 'Show Transcription'} (
            {HOTKEYS[Hotkey.ToggleTranscript].combo})
          </p>
        </TooltipContent>
      </Tooltip>

      <div className="h-5 w-px bg-border" aria-hidden="true" />

      {/* Previously reachable only via their hotkeys (lib/hotkeys.ts), with nothing on screen to
          point at. Same actions, now also a click. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={() =>
              void runActionSuggestion(
                () => getElectron()?.actionSuggestion.capture(),
                'Failed to capture screenshot'
              )
            }
            size="sm"
            className={cn(BAR_ICON_BUTTON, BAR_GHOST)}
            disabled={getDisabled(runningState) || actionBusy}
            aria-label="Capture screenshot"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Capture Screenshot ({HOTKEYS[Hotkey.Capture].combo})
          </p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={() =>
              void runActionSuggestion(
                () => getElectron()?.actionSuggestion.clearImages(),
                'Failed to clear captures'
              )
            }
            size="sm"
            className={cn(BAR_ICON_BUTTON, BAR_GHOST)}
            disabled={getDisabled(runningState) || actionBusy}
            aria-label="Clear captured screenshots"
          >
            <ImageOff className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Clear Captures ({HOTKEYS[Hotkey.ClearCaptures].combo})
          </p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={() =>
              void runActionSuggestion(
                () => getElectron()?.actionSuggestion.trigger(),
                'Failed to generate suggestion'
              )
            }
            size="sm"
            className={cn(BAR_ICON_BUTTON, BAR_GHOST)}
            disabled={getDisabled(runningState) || actionBusy}
            aria-label="Generate triggered suggestion"
          >
            {actionBusy ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Generate Suggestion ({HOTKEYS[Hotkey.TriggerWithoutCaptures].combo})
          </p>
        </TooltipContent>
      </Tooltip>

      <div className="h-5 w-px bg-border" aria-hidden="true" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={onClear}
            size="sm"
            className={cn(BAR_ICON_BUTTON, BAR_GHOST)}
            disabled={getDisabled(runningState) || exporting || clearing}
            aria-label="Clear the interview"
            aria-busy={clearing}
          >
            {clearing ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clear</p>
        </TooltipContent>
      </Tooltip>
      {/* Non-modal for the same reason as the titlebar menu: a modal menu locks body pointer
          events, and picking a format unmounts the menu before it releases the lock. */}
      <DropdownMenu modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(BAR_ICON_BUTTON, BAR_GHOST)}
                disabled={getDisabled(runningState) || exporting}
                aria-label="Export the interview"
                aria-busy={exporting}
              >
                {exporting ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export Interview</p>
          </TooltipContent>
        </Tooltip>
        {/* Opens upward, and not just for looks: the menu is portalled into the overflow-hidden
            <main> from main-frame, and the control panel is the bottom-most thing in it, so a
            downward menu would open past that edge and get clipped rather than merely flipped. */}
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuItem onClick={() => void onExportTranscript('docx')}>
            <FileText className="mr-2 h-4 w-4" />
            Word Document (.docx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void onExportTranscript('md')}>
            <Hash className="mr-2 h-4 w-4" />
            Markdown (.md)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
