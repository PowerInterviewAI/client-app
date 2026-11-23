import { Check } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { type Language, LANGUAGES } from '@/types/language';

interface LanguageSearchListProps {
  value: Language;
  onSelect: (code: Language) => void;
  /** Tag the languages the mock interviewer cannot speak. */
  showVoice?: boolean;
  className?: string;
}

/**
 * Substring matching, ranked by where the match starts.
 *
 * cmdk's default filter is fuzzy - the query only has to appear as a subsequence - which across 97
 * names puts "Español" under a search for "pol" and most of the list under "ja". A language a user
 * is looking for is typed as the start of one of its names, so a match at the start of the code
 * or of any word in either name ranks first, a match anywhere else second, and no match drops the
 * item.
 */
function matchLanguage(value: string, search: string, keywords?: string[]): number {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return 1;
  const names = [value, ...(keywords ?? [])].map((name) => name.toLocaleLowerCase());
  if (names.some((name) => name.split(/[\s()-]+/).some((word) => word.startsWith(query)))) return 1;
  if (names.some((name) => name.includes(query))) return 0.5;
  return 0;
}

/**
 * The interview-language list with a search box, shared by the control bar and the settings field.
 *
 * At 97 languages scrolling stops being a way to find one. Each item is matched on its English
 * name, its endonym and its code, because those are three different users: someone typing
 * "kurd" in an English UI, someone typing "کورد" in their own script, and someone who knows the
 * code from the control bar.
 *
 * Enum order is kept when the box is empty, which is what puts the original 28 at the top. The
 * current language is the highlighted item on open, so Enter keeps it and the arrow keys start
 * from it.
 */
export function LanguageSearchList({
  value,
  onSelect,
  showVoice = false,
  className,
}: LanguageSearchListProps) {
  const t = useT();

  return (
    <Command
      className={cn('bg-transparent', className)}
      defaultValue={value}
      filter={matchLanguage}
    >
      <CommandInput placeholder={t.languageSearch.placeholder} />
      <CommandList className="max-h-none min-h-0 flex-1">
        <CommandEmpty>{t.languageSearch.empty}</CommandEmpty>
        {LANGUAGES.map((item) => {
          const selected = item.code === value;
          return (
            <CommandItem
              key={item.code}
              // cmdk filters on `value` plus `keywords`; the code is unique, so it is the value.
              value={item.code}
              keywords={[item.name, item.nativeName, item.short]}
              onSelect={() => onSelect(item.code)}
              className="gap-2"
            >
              {/* A fixed column rather than conditionally rendered, so labels do not shift by
                  16px as the selection moves. */}
              <Check
                className={cn('h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
                aria-hidden="true"
              />
              {/* `dir="auto"` per endonym: Arabic, Persian, Urdu and the other RTL names need
                  their own direction, and a block boundary already isolates each one. Aligned
                  left regardless, or an RTL name sits against the English name at the far end of
                  the row instead of in the column the eye scans. */}
              <span
                dir="auto"
                className={cn('flex-1 truncate text-left', selected && 'font-medium')}
              >
                {item.nativeName}
              </span>
              {item.nativeName !== item.name && (
                <span className="truncate text-xs text-muted-foreground">{item.name}</span>
              )}
              {showVoice && !item.hasVoice && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t.languageField.textOnly}
                </span>
              )}
            </CommandItem>
          );
        })}
      </CommandList>
    </Command>
  );
}
