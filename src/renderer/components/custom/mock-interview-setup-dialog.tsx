import HeadphoneNoticeDialog from '@/components/custom/headphone-notice-dialog';
import { MockInterviewSetupFields } from '@/components/custom/mock-interview-setup-fields';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMockInterviewSetupForm } from '@/hooks/use-mock-interview-setup-form';
import type { MockInterviewSetup } from '@/types/mock-interview';

interface MockInterviewSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (setup: MockInterviewSetup) => Promise<void>;
}

/**
 * The way into a mock interview, opened from the home screen's launch card - and from that card
 * alone, since starting a session is a home-screen decision. Uses the same profile and job
 * context the live assistant already reads off the account, so nothing here asks for a CV or job
 * description a second time.
 *
 * Form state (`useMockInterviewSetupForm`) and fields (`MockInterviewSetupFields`) stay split out
 * of this dialog rather than inlined. That split is what let this dialog move from the control
 * bar to the home screen, and earlier let a full-page setup screen be retired, without either of
 * them changing.
 */
export function MockInterviewSetupDialog({
  open,
  onOpenChange,
  onStart,
}: MockInterviewSetupDialogProps) {
  const form = useMockInterviewSetupForm(onStart);
  const { starting, headphoneNoticeOpen, setHeadphoneNoticeOpen, handleStartClick, startAfterNotice } =
    form;

  return (
    <>
      {/* Handed off to the headphone notice rather than stacked under it. Two modal dialogs open
          at once each hold their own scroll lock and pointer-events layer, and here they would
          both unmount in the same commit as a route change - the shape that already left this app
          unclickable once with menus, which is why every menu in it is `modal={false}`.

          Only `open` is computed; this component stays mounted either way, so the form state
          lives through the notice and comes back untouched if the candidate cancels out of it. */}
      <Dialog open={open && !headphoneNoticeOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mock interview</DialogTitle>
            <DialogDescription>
              The AI asks, you answer out loud. Nothing is saved unless you export it.
            </DialogDescription>
          </DialogHeader>

          <MockInterviewSetupFields form={form} />

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartClick} disabled={starting}>
              {starting ? 'Starting…' : 'Start mock interview'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HeadphoneNoticeDialog
        open={headphoneNoticeOpen}
        onOpenChange={setHeadphoneNoticeOpen}
        onProceed={() => void startAfterNotice()}
        variant="mock"
      />
    </>
  );
}
