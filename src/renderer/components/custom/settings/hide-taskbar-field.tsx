import { Checkbox } from '@/components/ui/checkbox';
import { useHideTaskbar } from '@/hooks/use-hide-taskbar';
import { useT } from '@/i18n';

export function HideTaskbarField() {
  const t = useT();
  const { enabled, setEnabled } = useHideTaskbar();

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{t.hideTaskbarField.label}</p>
        <p className="text-xs text-muted-foreground">{t.hideTaskbarField.description}</p>
      </div>
      <Checkbox
        checked={enabled}
        onCheckedChange={(v) => setEnabled(v === true)}
        aria-label={t.hideTaskbarField.label}
      />
    </label>
  );
}
