import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeStore {
  /** What the user picked. */
  preference: ThemePreference;
  /** What is actually painted - `system` resolved against the OS setting. */
  theme: ResolvedTheme;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
  /** Follows an OS appearance change; a no-op unless the preference is `system`. */
  setSystemTheme: (system: ResolvedTheme) => void;
}

export const THEME_STORAGE_KEY = 'theme';

export function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Dark unless the user chose otherwise: the app sits beside a video call, usually over a dark
 * meeting window, where a white panel is the brightest thing on the screen.
 */
export function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Storage unavailable - fall through to the default.
  }
  return 'dark';
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

const initialPreference = readStoredPreference();
const initialTheme = resolve(initialPreference);

// Applied at module load, ahead of React's first paint. `index.html` ships with `class="dark"` for
// the default; a user who chose light would otherwise see one dark frame on every launch before
// the provider's effect ran.
document.documentElement.classList.toggle('dark', initialTheme === 'dark');

export const useThemeStore = create<ThemeStore>((set) => ({
  preference: initialPreference,
  theme: initialTheme,
  isDark: initialTheme === 'dark',
  setPreference: (preference) => {
    const theme = resolve(preference);
    set({ preference, theme, isDark: theme === 'dark' });
  },
  setSystemTheme: (system) =>
    set((state) =>
      state.preference === 'system' ? { theme: system, isDark: system === 'dark' } : state
    ),
}));
