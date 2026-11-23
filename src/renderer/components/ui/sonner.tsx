import {
  CircleCheckIcon,
  InfoIcon,
  LoaderIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { useThemeStore } from '@/hooks/use-theme-store';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useThemeStore();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      // Neutral surfaces with the meaning carried by a coloured icon, rather than a fully tinted
      // toast: this app sits beside a video call, and a red or green slab is the loudest thing on
      // the screen for as long as it is up.
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-500" />,
        info: <InfoIcon className="size-4 text-sky-500" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <LoaderIcon className="size-4 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        classNames: {
          toast: 'shadow-lg shadow-black/20',
          description: 'text-muted-foreground',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
