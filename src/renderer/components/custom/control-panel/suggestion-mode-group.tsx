import { ListChecks, Route } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSuggestionMode } from '@/hooks/use-suggestion-mode';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';
import { cn } from '@/lib/utils';

import { BAR_ACTIVE, BAR_GHOST, BAR_ICON_BUTTON } from './bar';

/**
 * Hint-only / full-sentence switch.
 *
 * Deliberately takes no `getDisabled`: this is a mid-interview control, like the transcript
 * toggle. It only affects the next suggestion, so leaving it live while the assistant runs
 * cannot corrupt an in-flight stream.
 *
 * Signals which mode is on twice over - the fill from `BAR_ACTIVE`, and the icon shape
 * (`ListChecks` for hint-only, `Route` for full sentences). The icon swap used to be carrying
 * this alone, because a fill against the `secondary` background the button sat on read as nearly
 * invisible; against the ghost resting state it is the clearer of the two, and the shape still
 * survives a colour-blind reader.
 */
export function SuggestionModeGroup() {
  const { hintOnly, toggle } = useSuggestionMode();

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(BAR_ICON_BUTTON, hintOnly ? BAR_ACTIVE : BAR_GHOST)}
            aria-pressed={hintOnly}
            aria-label={
              hintOnly
                ? 'Suggestion mode: hint-only. Switch to full sentences'
                : 'Suggestion mode: full sentences. Switch to hint-only'
            }
            onClick={toggle}
          >
            {hintOnly ? (
              <ListChecks className="h-4 w-4" />
            ) : (
              <Route className="h-4 w-4 -scale-y-100" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {hintOnly ? 'Hint-only mode' : 'Full-sentence mode'} (
            {HOTKEYS[Hotkey.ToggleSuggestionMode].combo})
          </p>
          <p className="text-xs text-muted-foreground">
            {hintOnly ? 'Headline + keyword bullets' : 'Answers written out in full'}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
