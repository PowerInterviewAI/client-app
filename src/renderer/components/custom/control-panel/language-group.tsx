import { AlertTriangle, Languages, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';

import { LanguageSearchList } from '@/components/custom/language-search-list';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { useInterviewLanguage } from '@/hooks/use-interview-language';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

import { BAR_GHOST } from './bar';

interface LanguageGroupProps {
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

/**
 * Interview language: which speech model transcribes, and what language answers come back in.
 *
 * Live mid-interview, and deliberately so - an interview that switches language is the case this
 * control exists for, and it is not one the candidate can prepare for by restarting. It takes
 * `getDisabled(state, false)`, which locks it only through the transient Starting and Stopping
 * states, where the sockets it would reconnect are being opened or torn down anyway.
 *
 * The switch is not instant, and the button says so: the ASR carries its language as a connection
 * parameter, so both channels reconnect. Suggestions need no wait, since the next request reads
 * the new setting as it is built.
 *
 * The trigger carries the code as well as the icon. A globe alone is only useful to someone who
 * already knows what it is set to, and the one thing this control has to answer at a glance is
 * exactly that - a candidate whose interview has just switched language has seconds.
 */
export function LanguageGroup({ getDisabled }: LanguageGroupProps) {
  const t = useT();
  const { runningState } = useAppState();
  const { language, option, switching, reconnectFailed, setLanguage, clearReconnectFailed } =
    useInterviewLanguage();
  const disabled = getDisabled(runningState, false) || switching;
  const [open, setOpen] = useState(false);

  // The half-applied state belongs to the session that produced it. The next start opens both
  // sockets on the stored language, so keeping the warning past a stop would describe something
  // that is no longer true.
  const running = runningState === RunningState.Running;
  useEffect(() => {
    if (!running) clearReconnectFailed();
  }, [running, clearReconnectFailed]);

  const halfApplied = running && reconnectFailed && !switching;

  return (
    <div className="flex items-center">
      {/* A popover rather than a dropdown menu because it holds a search box: a menu runs its own
          typeahead on every character key and would pull focus out of the input. Non-modal, as
          the export menu is: a modal layer locks body pointer events, and picking an item
          unmounts it before it releases the lock. */}
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                // BAR_ICON_BUTTON's height and radius, but not its fixed 32px width: the code
                // beside the icon is the point, and the row's rhythm is carried by the shared
                // height, not by every control being square.
                className={cn('h-8 gap-1.5 rounded-lg px-2', BAR_GHOST)}
                disabled={disabled}
                aria-label={
                  halfApplied
                    ? t.languageGroup.currentHalfApplied(option.name)
                    : t.languageGroup.current(option.name)
                }
                aria-busy={switching}
              >
                {/* Hidden from assistive tech: the button carries an aria-label, so an
                    unlabelled decorative glyph beside it is noise. Matches AudioGroup. */}
                {switching ? (
                  <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  // Tinted rather than badged: the trigger is already carrying the code, and a
                  // second mark beside it would crowd a 32px row. The colour says the setting is
                  // only half applied without claiming which half.
                  <Languages
                    className={cn('h-4 w-4', halfApplied && 'text-destructive')}
                    aria-hidden="true"
                  />
                )}
                <span className="text-[11px] font-medium tracking-wide">{option.short}</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t.languageGroup.tooltip(option.nativeName)}</p>
            <p className="text-xs text-muted-foreground">
              {switching
                ? t.languageGroup.reconnecting
                : halfApplied
                  ? t.languageGroup.suggestionsOnly
                  : t.languageGroup.speechAndSuggestions}
            </p>
          </TooltipContent>
        </Tooltip>
        {/* Opens upward: the popover is portalled into the overflow-hidden <main> from
            main-frame and the control panel is the bottom-most thing in it, so a downward list
            is clipped rather than flipped. Capped because it opens upward from the bottom-most
            control: an uncapped list of 97 runs off the top of the window. */}
        <PopoverContent
          align="start"
          side="top"
          className="flex max-h-[min(60vh,20rem)] w-64 flex-col p-0"
        >
          <div className="px-3 pt-2 pb-1 text-xs text-muted-foreground">
            {t.languageGroup.menuLabel}
          </div>
          <LanguageSearchList
            value={language}
            onSelect={(code) => {
              setOpen(false);
              void setLanguage(code);
            }}
            className="min-h-0 flex-1 p-1"
          />
          {running && (
            <div className="border-t">
              {/* The half-applied case outranks the notice below it. Suggestions have already
                  moved and transcription has not, so the checked item names a language only half
                  the session is in - and the toast that said so is long gone. */}
              {reconnectFailed && !switching ? (
                <div
                  role="alert"
                  className="flex items-start gap-1.5 px-3 py-1.5 text-xs text-destructive"
                >
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>{t.languageGroup.halfApplied}</span>
                </div>
              ) : (
                /* Says what will happen before it happens: a two-second hole in the transcript
                   is alarming if it arrives unannounced mid-question. */
                <div className="px-3 py-1.5 text-xs text-muted-foreground">
                  {t.languageGroup.willReconnect}
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
