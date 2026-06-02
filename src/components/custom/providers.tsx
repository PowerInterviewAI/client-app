import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useThemeStore } from '@/hooks/use-theme-store';

import { Toaster } from '../ui/sonner';
// Note: `useAppState` is now a standalone hook; no provider is needed.

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';

    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Queue state updates to avoid cascading renders
    Promise.resolve().then(() => {
      setTheme(initialTheme);
      setInitialized(true);
    });
  }, [setTheme]);

  useEffect(() => {
    if (!initialized) return;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme, initialized]);

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
