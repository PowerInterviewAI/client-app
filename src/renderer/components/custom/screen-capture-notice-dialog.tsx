import { ScreenShare, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAllowScreenCapture } from '@/hooks/use-allow-screen-capture';
import type { ScreenCaptureStatus } from '@/hooks/use-screen-capture-status';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface ScreenCaptureNoticeDialogProps {
  open: boolean;
  status: Exclude<ScreenCaptureStatus, 'protected'>;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  /** Cancel, Esc and an overlay click. Same contract as `HeadphoneNoticeDialog.onCancel`. */
  onCancel?: () => void;
}

/**
 * Raised before a live session when a screen share could show the window. Asked every session
 * rather than once, for the reason the headphone notice is: whether a share is about to happen is
 * a property of the meeting, and the setting may have been turned on for a demo and forgotten.
 */
export default function ScreenCaptureNoticeDialog({
  open,
  status,
  onOpenChange,
  onProceed,
  onCancel,
}: ScreenCaptureNoticeDialogProps) {
  const t = useT();
  const { setEnabled } = useAllowScreenCapture();
  const capturable = status === 'capturable';

  const handleDismiss = () => {
    onOpenChange(false);
    onCancel?.();
  };

  const handleProceed = () => {
    onOpenChange(false);
    onProceed();
  };

  const handleHideAndProceed = () => {
    setEnabled(false);
    handleProceed();
  };

  const Icon = capturable ? ScreenShare : ShieldAlert;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleDismiss())}>
      <DialogContent
        className={cn('max-w-sm', capturable ? 'border-destructive/50' : 'border-amber-500/50')}
      >
        <DialogHeader className="items-center text-center sm:text-center">
          <div
            className={cn(
              'mb-1 flex h-14 w-14 items-center justify-center rounded-full ring-4',
              capturable
                ? 'bg-destructive/15 text-destructive ring-destructive/10'
                : 'bg-amber-500/15 text-amber-600 ring-amber-500/10 dark:text-amber-400'
            )}
          >
            <Icon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-lg">
            {capturable ? t.screenCapture.capturableTitle : t.screenCapture.limitedTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground">
            {capturable
              ? t.screenCapture.capturableDescription
              : t.screenCapture.limitedDescription}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:flex-wrap">
          <Button variant="ghost" onClick={handleDismiss}>
            {t.common.cancel}
          </Button>
          {capturable ? (
            <>
              <Button variant="outline" onClick={handleProceed}>
                {t.screenCapture.startAnyway}
              </Button>
              <Button onClick={handleHideAndProceed}>{t.screenCapture.hideAndStart}</Button>
            </>
          ) : (
            <Button onClick={handleProceed}>{t.screenCapture.start}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
