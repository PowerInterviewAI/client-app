import { ScreenShare, ShieldAlert } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useScreenCaptureStatus } from '@/hooks/use-screen-capture-status';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface ScreenCaptureBadgeProps {
  /**
   * `bar` is icon-only, because the control bar is already full at the 840px minimum width.
   * `status` carries a label, sized for the stealth status panel's badge row.
   */
  variant: 'bar' | 'status';
  className?: string;
}

/**
 * Says when a screen share or recording can see the window. Nothing renders while the window is
 * protected - the warning is the state worth noticing, and a permanent "hidden" badge would
 * read as the guarantee the OS does not give.
 */
export function ScreenCaptureBadge({ variant, className }: ScreenCaptureBadgeProps) {
  const t = useT();
  const status = useScreenCaptureStatus();
  if (status === 'protected') return null;

  const capturable = status === 'capturable';
  const label = capturable ? t.screenCapture.capturableLabel : t.screenCapture.limitedLabel;
  const hint = capturable ? t.screenCapture.capturableHint : t.screenCapture.limitedHint;
  const Icon = capturable ? ScreenShare : ShieldAlert;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="status"
          aria-label={`${label}. ${hint}`}
          className={cn(
            'flex items-center gap-1 font-medium',
            variant === 'bar' ? 'h-8 rounded-lg border px-2' : 'h-6 rounded px-2 text-xs',
            capturable
              ? 'border-destructive/40 bg-destructive/15 text-destructive'
              : 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400',
            className
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {variant === 'status' && <span>{label}</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent sideOffset={4} className="max-w-xs">
        <p>{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </TooltipContent>
    </Tooltip>
  );
}
