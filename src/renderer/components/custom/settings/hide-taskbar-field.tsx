import { useId } from 'react';

import { Switch } from '@/components/ui/switch';
import { useHideTaskbar } from '@/hooks/use-hide-taskbar';
import { useT } from '@/i18n';

export function HideTaskbarField() {
  const t = useT();
  const descriptionId = useId();
  const { enabled, setEnabled } = useHideTaskbar();

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{t.hideTaskbarField.label}</p>
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {t.hideTaskbarField.description}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        aria-label={t.hideTaskbarField.label}
        aria-describedby={descriptionId}
      />
    </label>
  );
}
