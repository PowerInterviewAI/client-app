import { Monitor, Moon, Sun } from 'lucide-react';

import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { type ThemePreference, useThemeStore } from '@/hooks/use-theme-store';
import { useT } from '@/i18n';

/** The three theme choices as a radio group, for whichever dropdown hosts them. */
export function ThemeRadioItems() {
  const t = useT();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: 'dark', label: t.titlebarMenu.darkMode, icon: Moon },
    { value: 'light', label: t.titlebarMenu.lightMode, icon: Sun },
    { value: 'system', label: t.titlebarMenu.systemMode, icon: Monitor },
  ];

  return (
    <DropdownMenuRadioGroup
      value={preference}
      onValueChange={(v) => setPreference(v as ThemePreference)}
    >
      {options.map(({ value, label, icon: Icon }) => (
        <DropdownMenuRadioItem key={value} value={value}>
          <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
          {label}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}
