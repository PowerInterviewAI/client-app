import { Checkbox } from '@/components/ui/checkbox';
import { useTranscriptPanel } from '@/hooks/use-transcript-panel';
import { useT } from '@/i18n';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';

/**
 * The transcription dock's visibility, on the configuration page and in the first-run wizard.
 *
 * The whole row is the label, so the hit target is the card rather than a 16px box - the same
 * shape the mock interview's difficulty cards use.
 */
export function TranscriptPanelField() {
  const t = useT();
  const { visible, toggle } = useTranscriptPanel();

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{t.transcriptPanelField.label}</p>
        <p className="text-xs text-muted-foreground">
          {t.transcriptPanelField.description(HOTKEYS[Hotkey.ToggleTranscript].combo)}
        </p>
      </div>
      <Checkbox
        checked={visible}
        onCheckedChange={() => toggle()}
        aria-label={t.transcriptPanelField.label}
      />
    </label>
  );
}
