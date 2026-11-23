import { useEffect, useState } from 'react';

/**
 * The current time, re-read every `intervalMs`. Held in state rather than read during render, which
 * the React Compiler refuses: a render must give the same output for the same inputs, and the clock
 * is not an input until it is state.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
