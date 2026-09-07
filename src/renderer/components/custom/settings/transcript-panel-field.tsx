import { Checkbox } from '@/components/ui/checkbox';
import { useTranscriptPanel } from '@/hooks/use-transcript-panel';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';

/**
 * The transcription dock's visibility, on the configuration page and in the first-run wizard.
 *
 * The whole row is the label, so the hit target is the card rather than a 16px box - the same
 * shape the mock interview's difficulty cards use.
 */
export function TranscriptPanelField() {
  const { visible, toggle } = useTranscriptPanel();

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">Show the transcript panel</p>
        <p className="text-xs text-muted-foreground">
          Keeps a live transcript docked under your suggestions. Turn it off for more room to read
          them. Toggle any time with {HOTKEYS[Hotkey.ToggleTranscript].combo}.
        </p>
      </div>
      <Checkbox
        checked={visible}
        onCheckedChange={() => toggle()}
        aria-label="Show the transcript panel"
      />
    </label>
  );
}
