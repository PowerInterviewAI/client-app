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
    'shrink-0 px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap',
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
 */
export function HotkeyCheatsheet() {
  return (
    <div className="space-y-4">
      {HOTKEY_GROUPS.map((group) => (
        <div key={group.label}>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
            {group.label}
          </h4>
          <div className="space-y-2">
            {group.keys.map((hk) => {
              const info = HOTKEYS[hk];
              return (
                <div key={hk} className="flex items-start gap-2">
                  <div className={comboClass(hk)}>{info.combo}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{info.title}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                      {info.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Press ? anytime to reopen this list.</DialogDescription>
        </DialogHeader>
        <div className="overflow-auto flex-1">
          <HotkeyCheatsheet />
        </div>
      </DialogContent>
    </Dialog>
  );
}
