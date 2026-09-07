import { Fragment } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Hotkey, HOTKEY_GROUPS, HOTKEYS } from '@/lib/hotkeys';
import { cn } from '@/lib/utils';

const comboClass = (hk: Hotkey) =>
  cn(
    'flex items-center justify-center px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap',
    hk === Hotkey.StopAll
      ? 'bg-destructive/80 text-destructive-foreground'
      : hk === Hotkey.ToggleStealth
        ? 'bg-primary/80 text-primary-foreground'
        : 'bg-muted text-foreground'
  );

/**
 * The full hotkey reference, grouped and described. Shared so the control bar's status panel and
 * the documentation dialog can't drift out of sync the way the two independent copies they
 * replace already had.
 *
 * One grid for the whole sheet rather than a stack of rows per group, and that is the point of
 * it: the combos are different widths (`Ctrl+Shift+Q` against `Ctrl+Alt+Shift+[↑↓←→]`), so rows
 * laid out as flex pairs started every description at a different x - the eye had no column to
 * run down. A single `max-content` first column sizes itself to the widest combo *in the sheet*,
 * so every badge is the same width and every title starts on the same line, across groups as
 * well as within one. Group labels span both columns rather than opening a grid of their own,
 * which is what would put each group back on its own measurement.
 */
export function HotkeyCheatsheet() {
  return (
    <div className="grid grid-cols-[max-content_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
      {HOTKEY_GROUPS.map((group) => (
        <Fragment key={group.label}>
          <h4 className="col-span-2 text-xs font-semibold uppercase text-muted-foreground pt-2 first:pt-0">
            {group.label}
          </h4>
          {group.keys.map((hk) => {
            const info = HOTKEYS[hk];
            return (
              <Fragment key={hk}>
                {/* justify-center inside a cell the grid has already sized: the badges share a
                    column width, so a short combo would otherwise sit against its left edge with
                    a gap the eye reads as a missing character. */}
                <div className={comboClass(hk)}>{info.combo}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{info.title}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                    {info.description}
                  </p>
                </div>
              </Fragment>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

interface HotkeyCheatsheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HotkeyCheatsheetDialog({ open, onOpenChange }: HotkeyCheatsheetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          {/* Deliberately does not promise a `?` shortcut. That one is registered by
              `StatusPanel`, which only renders in stealth mode - so "press ? anytime" was untrue
              everywhere else this dialog is opened from: the configuration page and the command
              palette. The status panel's own button carries the hint where it does work. */}
          <DialogDescription>
            Everything you can reach without touching the app during an interview.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-auto flex-1">
          <HotkeyCheatsheet />
        </div>
      </DialogContent>
    </Dialog>
  );
}
