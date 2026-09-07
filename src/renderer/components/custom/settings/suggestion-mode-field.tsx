import { ListChecks, Route } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSuggestionMode } from '@/hooks/use-suggestion-mode';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';

/**
 * Hint-only vs. full-sentence, on the configuration page and in the first-run wizard.
 *
 * A radio pair rather than the control bar's single toggle: a toggle labelled with one of the two
 * modes never says what the other one is, which is fine on a 32px bar the user already knows and
 * wrong on the screen where they are choosing between them for the first time. Both options carry
 * an example of what the panel will actually look like.
 */
export function SuggestionModeField() {
  const { hintOnly, setHintOnly } = useSuggestionMode();

  return (
    <div className="space-y-2">
      <Label id="suggestion-mode-field-label">Suggestion style</Label>
      <RadioGroup
        aria-labelledby="suggestion-mode-field-label"
        value={hintOnly ? 'hint' : 'full'}
        onValueChange={(v) => setHintOnly(v === 'hint')}
        className="grid gap-2 sm:grid-cols-2"
      >
        <label className="flex cursor-pointer flex-col gap-1 rounded-md border p-3 text-sm has-data-[state=checked]:border-primary">
          <span className="flex items-center gap-2 font-medium">
            <RadioGroupItem value="hint" />
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            Hint-only
          </span>
          <span className="text-xs text-muted-foreground">
            A headline and keyword bullets you can read at a glance while you keep talking.
            Recommended.
          </span>
        </label>
        <label className="flex cursor-pointer flex-col gap-1 rounded-md border p-3 text-sm has-data-[state=checked]:border-primary">
          <span className="flex items-center gap-2 font-medium">
            <RadioGroupItem value="full" />
            <Route className="h-4 w-4 -scale-y-100" aria-hidden="true" />
            Full sentences
          </span>
          <span className="text-xs text-muted-foreground">
            The answer written out the way it would be spoken. More to read, less to improvise.
          </span>
        </label>
      </RadioGroup>
      <p className="text-xs text-muted-foreground">
        Switchable mid-interview from the control bar or{' '}
        {HOTKEYS[Hotkey.ToggleSuggestionMode].combo}.
      </p>
    </div>
  );
}
