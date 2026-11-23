import { Radio } from 'lucide-react';

import { useT } from '@/i18n';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';

/** The shortcuts worth knowing before the first question lands, in the order they get used. */
const TIPS: Hotkey[] = [
  Hotkey.ToggleSuggestionMode,
  Hotkey.ToggleStealth,
  Hotkey.Capture,
  Hotkey.StopAll,
];

/**
 * What a running session shows before anything has been heard.
 *
 * The panels hold sample placeholder copy until the first real write, which on a running session
 * reads as either a demo or a fault. This says what is actually happening - the app is listening
 * and the answer will appear here - and spends the wait on the four shortcuts that matter most
 * once the interview is under way.
 */
export function AwaitingFirstQuestion() {
  const t = useT();

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-5 flex h-12 w-12 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-primary/20 motion-reduce:animate-none"
          />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <Radio className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <h2 className="text-base font-semibold tracking-tight" role="status">
          {t.mainRoute.awaitingFirstQuestion.title}
        </h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {t.mainRoute.awaitingFirstQuestion.description}
        </p>

        <ul className="mt-5 divide-y rounded-xl border bg-card text-left">
          {TIPS.map((hotkey) => (
            <li key={hotkey} className="flex items-center justify-between gap-3 px-3.5 py-2">
              <span className="truncate text-xs">{t.hotkeys.keys[hotkey].title}</span>
              <kbd className="shrink-0 rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-foreground/80">
                {HOTKEYS[hotkey].combo}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
