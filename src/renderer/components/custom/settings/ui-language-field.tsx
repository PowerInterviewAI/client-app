import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUiLanguage } from '@/hooks/use-ui-language';
import { useT } from '@/i18n';
import { UI_LANGUAGES, type UiLanguage } from '@/types/ui-language';

/**
 * The app's chrome language, on the configuration page and as the first step of the first-run
 * wizard.
 *
 * Deliberately the same control in both places, like every other setting the wizard walks
 * through - but it is the only one whose position in that wizard is load-bearing. A user reading
 * the first screen of an app in a language they do not speak has one thing to find, and it is
 * this; everything after it, including the step this control sits on, re-renders in the language
 * they pick the moment they pick it.
 *
 * Only the endonym is listed. `LanguageField` shows the English name beside it because it is a
 * list of 28 that someone may be scanning without having found their own language yet; this list
 * is two entries read by someone whose app may currently be in the wrong one, for whom an English
 * column is the half of the row they cannot use.
 */
export function UiLanguageField() {
  const t = useT();
  const { uiLanguage, setUiLanguage } = useUiLanguage();

  return (
    <div className="space-y-2">
      <Label id="ui-language-field-label">{t.uiLanguageField.label}</Label>
      <Select value={uiLanguage} onValueChange={(v) => void setUiLanguage(v as UiLanguage)}>
        <SelectTrigger aria-labelledby="ui-language-field-label" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {UI_LANGUAGES.map((entry) => (
            <SelectItem key={entry.code} value={entry.code}>
              {entry.nativeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{t.uiLanguageField.description}</p>
    </div>
  );
}
