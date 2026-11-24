import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-xl border px-3 py-1 text-base border-transparent bg-muted shadow-none transition-[color,background-color,box-shadow,border-color] duration-150 outline-none hover:bg-accent dark:bg-white/[0.06] dark:hover:bg-white/[0.09] focus-visible:bg-background focus-visible:border-ring/60 focus-visible:ring-[3px] focus-visible:ring-ring/15 dark:focus-visible:bg-white/[0.04] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
