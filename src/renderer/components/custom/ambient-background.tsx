import { cn } from '@/lib/utils';

/**
 * Two heavily blurred brand colour fields behind a screen's content: orange and a cool violet.
 *
 * `animated` is for first-impression screens only (auth). Screens people pass through on the way
 * to work, like Home, take the still variant: depth without motion competing for attention.
 * Never on the interview routes. Transform-only animation so it stays on the compositor, and
 * `prefers-reduced-motion` freezes it (see `.ambient-*` in index.css).
 *
 * The parent must be `relative`; content above it needs `relative` too so it stacks on top.
 */
export function AmbientBackground({ animated = false }: { animated?: boolean }) {
  return (
    <div aria-hidden="true" className={cn('ambient', !animated && 'ambient-still')}>
      <div className="ambient-blob ambient-blob-a" />
      <div className="ambient-blob ambient-blob-b" />
    </div>
  );
}
