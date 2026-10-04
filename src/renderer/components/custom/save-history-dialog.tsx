import { FileText, Hash, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppState } from '@/hooks/use-app-state';
import { type SaveHistoryReason, useSaveHistoryPrompt } from '@/hooks/use-save-history-guard';
import useTools from '@/hooks/use-tools';
import { useT } from '@/i18n';
import { getElectron } from '@/lib/utils';
import type { ExportFormat } from '@/types/export';

import { showExportSuccessToast } from './export-success-toast';

/**
 * Asks whether to export before something destroys the interview.
 *
 * Mounted once, near the root, because the things it asks about do not share a screen: Clear,
 * Start and Stop are on the control panel, which stealth mode does not render; the close prompt
 * arrives from main with no component of its own at all; and the stop prompt outlives the screen
 * that raised it, since answering it is what sends the user home.
 */
export default function SaveHistoryDialog() {
  const t = useT();
  const { reason, settle, prompt } = useSaveHistoryPrompt();
  const { exportTranscript, exportMockReport } = useTools();
  const { appState } = useAppState();
  const [saving, setSaving] = useState<ExportFormat | null>(null);

  // Widened to trigger on either subject (see window-close-guard.ts), so it has to know which
  // export to call. The two are mutually exclusive in the ordinary case - a live session and a
  // mock one cannot run at the same time - but a live session left uncleared before a mock one
  // starts can leave both true at once; that rare case prefers the live export, which is the
  // subject this dialog has served the longest.
  const isMockSubject = appState?.hasMockContent === true && appState?.hasHistory !== true;
  const exportFn = isMockSubject ? exportMockReport : exportTranscript;

  // Main vetoes a close that would lose the interview and asks here instead, so the window is
  // held open until one of these two replies is sent. Registered once, for the lifetime of the
  // app: the prompt can arrive at any moment and there is no component tied to closing.
  useEffect(() => {
    const electron = getElectron();
    if (!electron?.onSaveHistoryPrompt) return;

    return electron.onSaveHistoryPrompt(() => {
      void prompt('close').then((proceed) => {
        if (proceed) electron.confirmClose();
        else electron.cancelClose();
      });
    });
  }, [prompt]);

  const save = async (format: ExportFormat) => {
    setSaving(format);
    try {
      const filePath = await exportFn(format);
      // Cancelled at the system save dialog. That is backing out of the file, not out of the
      // question, so the prompt stays up rather than reading as a decision to discard.
      if (!filePath) return;

      showExportSuccessToast(filePath, format);
      settle(true);
    } catch (error) {
      console.error(error);
      // The prompt stays open on a failure. Going ahead with the action here would destroy the
      // interview the user has just asked to keep, on the one path where saving did not work.
      toast.error(error instanceof Error ? error.message : t.saveHistory.exportFailed);
    } finally {
      setSaving(null);
    }
  };

  // `t.saveHistory.mock` is partial on purpose: `mock-done` and `mock-again` are raised only
  // from the report screen and are already written for it, so an entry there would be a second
  // copy of the same words.
  //
  // Read through a `Partial` view rather than cast `reason` into the narrower key union. The cast
  // would be asserting something false - `reason` really can be `mock-done`, which that object
  // really does not have - and it is the `??` below that handles it. The view says the lookup can
  // miss; the cast said it cannot and then relied on it doing so anyway.
  const mockCopy: Partial<Record<SaveHistoryReason, (typeof t.saveHistory.live)['clear']>> =
    t.saveHistory.mock;
  const copy = reason
    ? isMockSubject
      ? (mockCopy[reason] ?? t.saveHistory.live[reason])
      : t.saveHistory.live[reason]
    : null;
  const busy = saving !== null;
  // Both formats write the same content, so the choice is one of what to do with the file
  // afterwards rather than of what is being kept - said once, under the two buttons, instead of
  // left for the user to infer from two equally-weighted primaries.
  const formatHint = isMockSubject ? t.saveHistory.formatHintMock : t.saveHistory.formatHintLive;

  // Every other reason can be answered with "not now" by pressing Esc, and that answer leaves
  // the interview exactly where it was. After a stop there is no "not now" left to mean - the
  // session has ended and the buffers go either way - so an Esc that looked like backing out
  // would silently be the discard. The three buttons are the whole decision.
  const dismissible = reason !== 'stop';

  return (
    <Dialog
      open={reason !== null}
      // Esc, the overlay and the close button all mean "not now", which is the safe answer.
      // Ignored mid-export: the file is still being written and the answer is not settled yet.
      onOpenChange={(next) => {
        if (next || busy || !dismissible) return;
        settle(false);
      }}
    >
      <DialogContent className="max-w-sm" showCloseButton={dismissible && !busy}>
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          {/* The body carries the whole explanation now. It used to be a per-reason sentence
              followed by one fixed clause about nothing being written to disk "until you
              export" - which is the live assistant's word for it, and on the mock report screen
              named an action that has no button. Folding it into each entry lets the mock copy
              say "save" and lets `stop` say it in the past tense, which is when it is true. */}
          <DialogDescription>{copy?.body}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              onClick={() => void save('docx')}
              disabled={busy}
              aria-busy={saving === 'docx'}
            >
              {saving === 'docx' ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {t.saveHistory.saveAsWord}
            </Button>
            <Button
              className="flex-1"
              size="sm"
              variant="outline"
              onClick={() => void save('md')}
              disabled={busy}
              aria-busy={saving === 'md'}
            >
              {saving === 'md' ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Hash className="mr-2 h-4 w-4" />
              )}
              {t.saveHistory.saveAsMarkdown}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{formatHint}</p>
          <div className="flex gap-2">
            {dismissible && (
              <Button
                className="flex-1"
                size="sm"
                variant="ghost"
                onClick={() => settle(false)}
                disabled={busy}
              >
                {t.common.cancel}
              </Button>
            )}
            <Button
              className="flex-1"
              size="sm"
              variant="destructive"
              onClick={() => settle(true)}
              disabled={busy}
            >
              {copy?.discard}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
