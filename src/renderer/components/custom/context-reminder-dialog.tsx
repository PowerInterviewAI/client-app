import { FileText, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { getElectron } from '@/lib/utils';

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

interface AccountPreview {
  fullName: string;
  profileData: string;
  context: string;
}

// The CV and the context run to 128,000 characters each; only the opening is rendered, and the
// line clamp below does the visual cut. Sliced first so the DOM never holds the whole thing.
const PREVIEW_CHARS = 400;

/**
 * Raised before every live and mock session to confirm the account's job context fits it.
 *
 * The context is one account-wide value that outlives the interview it was written for, so a
 * set context is not a current one: a candidate moving between applications starts the next
 * interview against the last job description, and every suggestion is quietly tailored to the
 * wrong role. Nothing downstream can tell, so it is asked every time, like the headphone notice.
 *
 * The opening of each field is shown so the answer is a glance rather than a recollection. It is
 * fetched over `account:get` on open, because the app state carries only a summary.
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
  const [preview, setPreview] = useState<AccountPreview | null>(null);
  // A failed fetch hides the preview rather than leaving it on "Loading" or reading as "Not set".
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void getElectron()
      ?.account?.get()
      .then((result) => {
        if (cancelled) return;
        if (!result?.success || !result.data) {
          setPreviewFailed(true);
          return;
        }
        setPreviewFailed(false);
        setPreview({
          fullName: result.data.fullName,
          profileData: result.data.profileData.slice(0, PREVIEW_CHARS),
          context: result.data.context.slice(0, PREVIEW_CHARS),
        });
      })
      .catch((error) => {
        console.error('Failed to load the account preview:', error);
        if (!cancelled) setPreviewFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

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
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary ring-4 ring-primary/10">
            <FileText className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg">{copy.title}</DialogTitle>
          <DialogDescription className="text-sm text-foreground">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        {!previewFailed && (
          <dl className="space-y-2.5 rounded-xl bg-muted p-3.5 text-sm dark:bg-white/[0.05]">
            <PreviewRow
              label={t.profileFields.fullName}
              value={preview?.fullName}
              lines={1}
              notSet={t.contextReminder.notSet}
              loading={t.common.loading}
            />
            <PreviewRow
              label={t.profileFields.profile}
              value={preview?.profileData}
              lines={2}
              notSet={t.contextReminder.notSet}
              loading={t.common.loading}
            />
            <PreviewRow
              label={t.profileFields.context}
              value={preview?.context}
              lines={4}
              notSet={t.contextReminder.notSet}
              loading={t.common.loading}
              highlight
            />
          </dl>
        )}

        {!hasContext && <p className="text-xs text-muted-foreground">{t.contextReminder.hint}</p>}

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

const LINE_CLAMP = { 1: 'line-clamp-1', 2: 'line-clamp-2', 4: 'line-clamp-4' } as const;

function PreviewRow({
  label,
  value,
  lines,
  notSet,
  loading,
  highlight = false,
}: {
  label: string;
  value: string | undefined;
  lines: keyof typeof LINE_CLAMP;
  notSet: string;
  loading: string;
  /** The context is what this dialog is asking about, so it is the row that stands out. */
  highlight?: boolean;
}) {
  const text = value?.trim();
  return (
    <div className={highlight ? 'border-l-2 border-primary/60 pl-2' : undefined}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        dir="auto"
        className={`break-words ${LINE_CLAMP[lines]} ${text ? 'text-foreground' : 'italic text-muted-foreground'}`}
      >
        {value === undefined ? loading : text || notSet}
      </dd>
    </div>
  );
}
