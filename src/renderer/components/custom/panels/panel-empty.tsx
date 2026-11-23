import type { LucideIcon } from 'lucide-react';

/** What a panel shows before it has anything in it: an icon in a soft tile above one line. */
export function PanelEmpty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="max-w-xs text-[13px] text-muted-foreground">{text}</p>
    </div>
  );
}
