import { useT } from '@/i18n';
import { RunningState } from '@/types/app-state';

interface RunningIndicatorProps {
  runningState: RunningState;
  compact?: boolean;
  className?: string;
}

/**
 * The width is fixed so the badge does not change size as the state moves - it sits at the left
 * end of the status row, and a badge that resized would shift everything beside it four times a
 * session. `w-28` rather than `w-24` because the labels are translated: nine characters of
 * uppercase bold Cyrillic (`ОСТАНОВКА`) do not fit 96px once the dot and the padding are out,
 * and the overflow is a second line rather than a clip, which makes the whole row taller.
 */
export function RunningIndicator({
  runningState,
  compact = false,
  className = '',
}: RunningIndicatorProps) {
  const t = useT();

  const indicatorConfig: Record<
    RunningState,
    { dotClass: string; label: string; labelClass: string }
  > = {
    [RunningState.Idle]: {
      dotClass: 'bg-muted-foreground',
      label: t.runningIndicator.idle,
      labelClass: 'text-muted-foreground',
    },
    [RunningState.Starting]: {
      dotClass: 'bg-primary animate-pulse',
      label: t.runningIndicator.starting,
      labelClass: 'text-primary animate-pulse',
    },
    [RunningState.Running]: {
      dotClass: 'bg-destructive animate-pulse',
      label: t.runningIndicator.running,
      labelClass: 'text-destructive animate-pulse',
    },
    [RunningState.Stopping]: {
      dotClass: 'bg-destructive animate-pulse',
      label: t.runningIndicator.stopping,
      labelClass: 'text-destructive animate-pulse',
    },
  };

  const { dotClass, label, labelClass } = indicatorConfig[runningState];

  if (compact) {
    return <span className={`inline-block h-3 w-3 rounded-full ${dotClass} ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1 w-28 rounded-md bg-muted/50 ${className}`}>
      <div className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className={`text-xs font-bold uppercase ${labelClass}`}>{label}</span>
    </div>
  );
}

export default RunningIndicator;
