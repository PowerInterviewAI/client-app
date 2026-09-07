import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Plain-overflow scroll container, not a Radix primitive.
 *
 * `transcript-panel.tsx` already gets a scrollable region from `overflow-y-auto` on a native div,
 * and that is all this needs too - a custom-scrollbar version would add a dependency for a visual
 * difference nothing here asks for.
 */
function ScrollArea({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="scroll-area"
      className={cn('relative overflow-y-auto overflow-x-hidden', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { ScrollArea };
