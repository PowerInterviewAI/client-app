import { ScreenShare, ShieldAlert, ShieldCheck } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useScreenCaptureStatus } from '@/hooks/use-screen-capture-status';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface ScreenCaptureBadgeProps {
  /**
   * `bar` is icon-only, because the control bar is already full at the 840px minimum width.
   * `status` adds a label from 1000px up, sized for the stealth status panel's badge row. That row
   * is already full at the 840px minimum in German and Russian, so below it the icon and the
   * tooltip carry the state.
   */
  variant: 'bar' | 'status';
  className?: string;
}

/**
 * Says whether a screen share or recording can see the window. All three states render, so the
 * candidate can confirm protection at a glance rather than inferring it from an absent warning.
 * `protected` is only reported where the OS honours it; macOS reads as `limited`.
 */
export function ScreenCaptureBadge({ variant, className }: ScreenCaptureBadgeProps) {
  const t = useT();
  const status = useScreenCaptureStatus();
  const { label, hint, Icon, tone } = {
    capturable: {
      label: t.screenCapture.capturableLabel,
      hint: t.screenCapture.capturableHint,
      Icon: ScreenShare,
      tone: 'border-destructive/40 bg-destructive/15 text-destructive',
    },
    limited: {
      label: t.screenCapture.limitedLabel,
      hint: t.screenCapture.limitedHint,
      Icon: ShieldAlert,
      tone: 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    protected: {
      label: t.screenCapture.protectedLabel,
      hint: t.screenCapture.protectedHint,
      Icon: ShieldCheck,
      tone: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
  }[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="status"
          aria-label={`${label}. ${hint}`}
          className={cn(
            'flex items-center gap-1 font-medium',
            variant === 'bar' ? 'h-8 rounded-lg border px-2' : 'h-6 rounded px-2 text-xs',
            tone,
            className
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {variant === 'status' && <span className="hidden min-[1000px]:inline">{label}</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent sideOffset={4} className="max-w-xs">
        <p>{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </TooltipContent>
    </Tooltip>
  );
}
