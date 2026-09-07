import { useEffect, useRef } from 'react';

import { useMicLevel } from '@/hooks/use-mic-level';

/**
 * A live input-level bar for a microphone test.
 *
 * Reads `useMicLevel`'s ref inside its own `requestAnimationFrame` loop and writes the width to
 * the DOM directly, rather than holding the level in React state - the value changes every frame
 * and only this one element displays it, so a re-render per frame would buy nothing.
 *
 * The bar is not the whole answer on its own: a level that never moves looks the same as one this
 * component simply is not receiving, so the caller pairs it with the "say something" copy and the
 * `speaking` hint below, which is what tells the user the test is actually working.
 */
export function MicLevelMeter({ stream }: { stream: MediaStream | null }) {
  const levelRef = useMicLevel(stream);
  const barRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let raf = 0;
    // Sustained rather than instantaneous: speech dips to silence between syllables, and a hint
    // keyed on the raw level flickers on every gap. Decays slowly so it stays up across a word.
    let peak = 0;

    const tick = () => {
      // Amplified: normal speech sits well under a tenth of full scale on most microphones, and
      // a bar drawn from the raw value barely leaves the left edge for a user who is speaking
      // perfectly audibly. Clamped so a loud room still reads as "loud" rather than overflowing.
      const level = Math.min(1, levelRef.current * 4);
      peak = Math.max(level, peak * 0.94);

      if (barRef.current) barRef.current.style.width = `${Math.round(level * 100)}%`;
      if (hintRef.current) hintRef.current.textContent = peak > 0.08 ? 'Hearing you' : 'Silent';

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [levelRef]);

  return (
    <div className="space-y-1.5">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label="Microphone input level"
      >
        <div ref={barRef} className="h-full w-0 rounded-full bg-primary transition-[width]" />
      </div>
      <p ref={hintRef} className="text-xs text-muted-foreground tabular-nums" role="status">
        Silent
      </p>
    </div>
  );
}
