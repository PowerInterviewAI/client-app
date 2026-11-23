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
 * The interview-language list with a search box, shared by the control bar and the settings field.
 *
 * At 97 languages scrolling stops being a way to find one. Each item is matched on its English
 * name, its endonym and its code, because those are three different users: someone typing
 * "kurd" in an English UI, someone typing "کورد" in their own script, and someone who knows the
 * code from the control bar. cmdk scores the match, so "ja" finds Japanese before Kinyarwanda.
 *
 * Enum order is kept when the box is empty, which is what puts the original 28 at the top.
 */
export function LanguageSearchList({
  value,
  onSelect,
  showVoice = false,
  className,
}: LanguageSearchListProps) {
  const t = useT();

  return (
    <Command className={cn('bg-transparent', className)}>
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
              keywords={[item.name, item.nativeName]}
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
                  their own direction, and a block boundary already isolates each one. */}
              <span dir="auto" className={cn('flex-1 truncate', selected && 'font-medium')}>
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
