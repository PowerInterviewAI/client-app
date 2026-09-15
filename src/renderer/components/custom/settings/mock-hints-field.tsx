import { Checkbox } from '@/components/ui/checkbox';
import { useMockLiveSuggestions } from '@/hooks/use-mock-live-suggestions';

/**
 * Whether a practice interview also shows what the live assistant would have answered, on the
 * configuration page and in the first-run wizard.
 *
 * The same row shape `TranscriptPanelField` uses, and here for the same reason the setting has a
 * default at all: it used to live only on the mock session bar, where a candidate had to already
 * know the comparison existed to find it - mid-question, which is the worst moment to go looking.
 */
export function MockHintsField() {
  const { enabled, setEnabled } = useMockLiveSuggestions();

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">Show hints in practice interviews</p>
        <p className="text-xs text-muted-foreground">
          Puts what the live assistant would have answered beside each practice question, so you can
          compare it against your own. Turn it off to answer unprompted - you can switch it either
          way from the session bar mid-practice. This changes nothing about a real interview.
        </p>
      </div>
      <Checkbox
        checked={enabled}
        onCheckedChange={(v) => setEnabled(v === true)}
        aria-label="Show hints in practice interviews"
      />
    </label>
  );
}
