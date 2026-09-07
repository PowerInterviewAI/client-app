import { AlertTriangle, Loader } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInterviewLanguage } from '@/hooks/use-interview-language';
import { type Language, LANGUAGES } from '@/types/language';

interface LanguageFieldProps {
  /** Replaces the helper line under the picker, for a surface where it means something else. */
  description?: string;
  /**
   * Say which languages the interviewer can speak, and warn when the chosen one is not among
   * them. Only the mock interview has any use for this - the live assistant never speaks - which
   * is why it is opt-in rather than always shown.
   */
  showVoice?: boolean;
}

/**
 * The interview language, on the configuration page, in the first-run wizard, and in the mock
 * interview's setup dialog.
 *
 * There is one language setting, not one per surface: it picks the speech model for transcription
 * and the language answers come back in, and a mock session reads the same stored value the live
 * assistant does. So all three places edit the same thing through this component, rather than the
 * mock dialog showing a read-only copy and telling the user to go and change it somewhere else.
 *
 * Both names are shown, endonym first: someone looking for their own language recognises
 * "Deutsch" before "German", and the English name is there for anyone who has not found theirs
 * in the list yet. Same reasoning as `LanguageOption`'s two name fields.
 *
 * Carries the switching and reconnect-failed states from `useInterviewLanguage` rather than
 * dropping them, because this control is reachable mid-session: changing the language there tears
 * the ASR sockets down and re-opens them, and a reconnect that fails leaves transcription on the
 * old language while this picker shows the new one.
 */
export function LanguageField({ description, showVoice = false }: LanguageFieldProps) {
  const { language, option, switching, reconnectFailed, setLanguage } = useInterviewLanguage();

  return (
    <div className="space-y-2">
      <Label id="language-field-label">Interview language</Label>
      <div className="flex items-center gap-2">
        <Select
          value={language}
          disabled={switching}
          onValueChange={(v) => void setLanguage(v as Language)}
        >
          <SelectTrigger aria-labelledby="language-field-label" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((entry) => (
              <SelectItem key={entry.code} value={entry.code}>
                {entry.nativeName}
                <span className="text-muted-foreground"> ({entry.name})</span>
                {/* Inside the item, so the trigger repeats it for the current choice. The
                    constraint applies to the language that is selected, not only to the ones
                    being browsed past. */}
                {showVoice && !entry.hasVoice && (
                  <span className="text-muted-foreground"> &middot; text only</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {switching && (
          <Loader
            className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {reconnectFailed ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>
            Suggestions switched language, but transcription is still reconnecting. Stop and start
            the assistant if it does not come back.
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {description ?? 'What is transcribed, and what your suggestions come back in.'}
        </p>
      )}

      {showVoice && !option.hasVoice && (
        <Alert>
          <AlertDescription>
            The interviewer will write its questions instead of speaking them. You still answer out
            loud, and the scoring is the same.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
