import { Checkbox } from '@/components/ui/checkbox';
import { useAllowScreenCapture } from '@/hooks/use-allow-screen-capture';
import { useT } from '@/i18n';

export function AllowScreenCaptureField() {
  const t = useT();
  const { enabled, setEnabled } = useAllowScreenCapture();

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{t.allowScreenCaptureField.label}</p>
        <p className="text-xs text-muted-foreground">{t.allowScreenCaptureField.description}</p>
      </div>
      <Checkbox
        checked={enabled}
        onCheckedChange={(v) => setEnabled(v === true)}
        aria-label={t.allowScreenCaptureField.label}
      />
    </label>
  );
}
