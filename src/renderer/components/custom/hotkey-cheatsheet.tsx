import { Fragment } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/i18n';
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
 * The full hotkey reference, grouped and described. Shared so the stealth status panel's hover
 * card and the documentation dialog can't drift out of sync the way the two independent copies they
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
  const t = useT();

  return (
    <div className="grid grid-cols-[max-content_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
      {HOTKEY_GROUPS.map((group) => (
        <Fragment key={group.id}>
          <h4 className="col-span-2 text-xs font-semibold uppercase text-muted-foreground pt-2 first:pt-0">
            {t.hotkeys.groups[group.id]}
          </h4>
          {group.keys.map((hk) => {
            const info = HOTKEYS[hk];
            const copy = t.hotkeys.keys[hk];
            return (
              <Fragment key={hk}>
                {/* justify-center inside a cell the grid has already sized: the badges share a
                    column width, so a short combo would otherwise sit against its left edge with
                    a gap the eye reads as a missing character. */}
                <div className={comboClass(hk)}>{info.combo}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{copy.title}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                    {copy.description}
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

/**
 * Titles only, in two columns of groups where the window allows. For the stealth status panel,
 * which cannot scroll - wheel events do not reach a click-through window - so the full sheet's
 * descriptions ran off the bottom of a stealth-sized window with no way to reach them.
 */
export function CompactHotkeyCheatsheet() {
  const t = useT();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
      {HOTKEY_GROUPS.map((group) => (
        <div
          key={group.id}
          className="grid grid-cols-[max-content_minmax(0,1fr)] content-start items-center gap-x-2 gap-y-1"
        >
          <h4 className="col-span-2 text-[10px] font-semibold uppercase text-muted-foreground">
            {t.hotkeys.groups[group.id]}
          </h4>
          {group.keys.map((hk) => (
            <Fragment key={hk}>
              <div className={cn(comboClass(hk), 'px-1.5 py-0.5 text-[10px]')}>
                {HOTKEYS[hk].combo}
              </div>
              <p className="text-xs leading-tight truncate">{t.hotkeys.keys[hk].title}</p>
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

interface HotkeyCheatsheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HotkeyCheatsheetDialog({ open, onOpenChange }: HotkeyCheatsheetDialogProps) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.hotkeys.dialogTitle}</DialogTitle>
          {/* Deliberately does not promise a `?` shortcut: no screen that opens this dialog
              registers one. */}
          <DialogDescription>{t.hotkeys.dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="overflow-auto flex-1">
          <HotkeyCheatsheet />
        </div>
      </DialogContent>
    </Dialog>
  );
}
