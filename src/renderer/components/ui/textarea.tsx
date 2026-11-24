import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-xl border px-3 py-2 text-base border-transparent bg-muted shadow-none transition-[color,background-color,box-shadow,border-color] duration-150 outline-none hover:bg-accent dark:bg-white/[0.06] dark:hover:bg-white/[0.09] focus-visible:bg-background focus-visible:border-ring/60 focus-visible:ring-[3px] focus-visible:ring-ring/15 dark:focus-visible:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
