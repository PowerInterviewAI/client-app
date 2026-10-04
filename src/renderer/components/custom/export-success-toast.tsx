import { CircleCheck, FileIcon, FolderOpenIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfigStore } from '@/hooks/use-config-store';
import { translationFor } from '@/i18n';
import { getElectron } from '@/lib/utils';
import type { ExportFormat } from '@/types/export';

/**
 * Confirm an export and offer the file.
 *
 * A save dialog's own path is gone the moment it closes, so "where did that go" is the next
 * question every time. Shared between the export menu and the save-before-clearing prompt so
 * the answer does not depend on which one the user reached for.
 */
export function showExportSuccessToast(filePath: string, format: ExportFormat): void {
  const electron = getElectron();
  const toastId = `export-${Date.now()}`;
  // Not a component, so there is no `useT` to call: this is a plain function invoked from a
  // click handler. The language is read off the config store directly, which is the same value
  // the hook would have resolved.
  const t = translationFor(useConfigStore.getState().config?.uiLanguage);

  toast.custom(
    () => (
      <div
        className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border shadow-md"
        style={{
          background: 'var(--success-bg)',
          borderColor: 'var(--success-border)',
          color: 'var(--success-text)',
        }}
      >
        <CircleCheck className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-sm font-medium">
          {t.exportToast.exported(format === 'md' ? t.exportToast.markdown : t.exportToast.word)}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0"
                aria-label={t.exportToast.openFileLabel}
                onClick={() => electron?.openFile(filePath)}
              >
                <FileIcon className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.exportToast.openFile}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0"
                aria-label={t.exportToast.showInFolderLabel}
                onClick={() => electron?.showInFolder(filePath)}
              >
                <FolderOpenIcon className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.exportToast.showInFolder}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                aria-label={t.exportToast.dismiss}
                onClick={() => toast.dismiss(toastId)}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.exportToast.dismiss}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    ),
    { id: toastId, duration: 10_000, style: { width: 'var(--width, 356px)' } }
  );
}
