import { FileText, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/i18n';

interface ContextReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Picks the copy: an empty context is reported as missing, a set one is asked about. */
  hasContext: boolean;
  onProceed: () => void;
  onEditContext: () => void;
  /**
   * Esc or a click on the overlay. Kept apart from `onOpenChange(false)` for the same reason the
   * headphone notice keeps it apart: both buttons close through that too.
   */
  onCancel?: () => void;
}

/**
 * Raised before every live and mock session to confirm the account's job context fits it.
 *
 * The context is one account-wide value that outlives the interview it was written for, so a
 * set context is not a current one: a candidate moving between applications starts the next
 * interview against the last job description, and every suggestion is quietly tailored to the
 * wrong role. Nothing downstream can tell, so it is asked every time, like the headphone notice.
 */
export default function ContextReminderDialog({
  open,
  onOpenChange,
  hasContext,
  onProceed,
  onEditContext,
  onCancel,
}: ContextReminderDialogProps) {
  const t = useT();
  const copy = hasContext
    ? {
        title: t.contextReminder.setTitle,
        description: t.contextReminder.setDescription,
        edit: t.contextReminder.review,
        proceed: t.contextReminder.confirm,
      }
    : {
        title: t.contextReminder.title,
        description: t.contextReminder.description,
        edit: t.contextReminder.edit,
        proceed: t.contextReminder.proceed,
      };

  const handleDismiss = () => {
    onOpenChange(false);
    onCancel?.();
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEditContext();
  };

  const handleProceed = () => {
    onOpenChange(false);
    onProceed();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleDismiss())}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary ring-4 ring-primary/10">
            <FileText className="h-7 w-7" />
          </div>
          <DialogTitle className="text-lg">{copy.title}</DialogTitle>
          <DialogDescription className="text-sm text-foreground">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
          {t.contextReminder.hint}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={handleEdit}>
            <FileText className="h-4 w-4" />
            {copy.edit}
          </Button>
          <Button onClick={handleProceed}>
            <Play className="h-4 w-4" />
            {copy.proceed}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
