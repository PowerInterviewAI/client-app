import { AlertTriangle, ChevronDown, Loader } from 'lucide-react';
import { useState } from 'react';

import { LanguageSearchList } from '@/components/custom/language-search-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useInterviewLanguage } from '@/hooks/use-interview-language';
import { useT } from '@/i18n';

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
  const t = useT();
  const { language, option, switching, reconnectFailed, setLanguage } = useInterviewLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label id="language-field-label">{t.languageField.label}</Label>
      <div className="flex items-center gap-2">
        {/* A searchable popover rather than a Select: 97 languages are not found by scrolling,
            and a Select runs its own typeahead that would pull focus out of a search box. The
            trigger keeps the Select's look so the form reads the same as before. */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              aria-labelledby="language-field-label"
              disabled={switching}
              className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50"
            >
              <span className="line-clamp-1 text-left">
                <span dir="auto">{option.nativeName}</span>
                <span className="text-muted-foreground"> ({option.name})</span>
                {/* Repeated on the trigger: the constraint applies to the language that is
                    selected, not only to the ones being browsed past. */}
                {showVoice && !option.hasVoice && (
                  <span className="text-muted-foreground">
                    {' '}
                    &middot; {t.languageField.textOnly}
                  </span>
                )}
              </span>
              <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="flex max-h-[min(50vh,18rem)] w-(--radix-popover-trigger-width) min-w-64 flex-col p-0"
          >
            <LanguageSearchList
              value={language}
              showVoice={showVoice}
              onSelect={(code) => {
                setOpen(false);
                void setLanguage(code);
              }}
              className="min-h-0 flex-1 p-1"
            />
          </PopoverContent>
        </Popover>
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
          <span>{t.languageField.reconnectFailed}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {description ?? t.languageField.description}
        </p>
      )}

      {showVoice && !option.hasVoice && (
        <Alert>
          <AlertDescription>{t.languageField.noVoiceNotice}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
