import { useId } from 'react';

import { Switch } from '@/components/ui/switch';
import { useMockLiveSuggestions } from '@/hooks/use-mock-live-suggestions';
import { useT } from '@/i18n';

/**
 * Whether a mock interview also shows what the live assistant would have answered, on the
 * configuration page and in the first-run wizard.
 *
 * The same row shape `TranscriptPanelField` uses, and here for the same reason the setting has a
 * default at all: it used to live only on the mock session bar, where a candidate had to already
 * know the comparison existed to find it - mid-question, which is the worst moment to go looking.
 */
export function MockHintsField() {
  const t = useT();
  const descriptionId = useId();
  const { enabled, setEnabled } = useMockLiveSuggestions();

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{t.mockHintsField.label}</p>
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {t.mockHintsField.description}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        aria-label={t.mockHintsField.label}
        aria-describedby={descriptionId}
      />
    </label>
  );
}
