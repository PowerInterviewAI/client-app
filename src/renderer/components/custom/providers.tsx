import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { THEME_STORAGE_KEY, useThemeStore } from '@/hooks/use-theme-store';

import { Toaster } from '../ui/sonner';
// Note: `useAppState` is now a standalone hook; no provider is needed.

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useThemeStore((s) => s.preference);
  const theme = useThemeStore((s) => s.theme);
  const setSystemTheme = useThemeStore((s) => s.setSystemTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Storage unavailable - the choice lasts for this session only.
    }
  }, [preference]);

  // Live, so `system` follows the OS switching to dark at sunset without a relaunch.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [setSystemTheme]);

  return (
    <div>
      {children}
      {/* Toaster adapts to theme */}
      <Toaster richColors position="top-center" theme={theme} />
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
