import { RunningState } from '@/types/app-state';

type Props = {
  runningState: RunningState;
  compact?: boolean;
  className?: string;
};

export function RunningIndicator({ runningState, compact = false, className = '' }: Props) {
  const indicatorConfig: Record<
    RunningState,
    { dotClass: string; label: string; labelClass: string }
  > = {
    [RunningState.Idle]: {
      dotClass: 'bg-muted-foreground',
      label: 'Idle',
      labelClass: 'text-muted-foreground',
    },
    [RunningState.Starting]: {
      dotClass: 'bg-primary animate-pulse',
      label: 'Starting',
      labelClass: 'text-primary animate-pulse',
    },
    [RunningState.Running]: {
      dotClass: 'bg-destructive animate-pulse',
      label: 'Running',
      labelClass: 'text-destructive animate-pulse',
    },
    [RunningState.Stopping]: {
      dotClass: 'bg-destructive animate-pulse',
      label: 'Stopping',
      labelClass: 'text-destructive animate-pulse',
    },
  };

  const { dotClass, label, labelClass } = indicatorConfig[runningState];

  if (compact) {
    return <span className={`inline-block h-3 w-3 rounded-full ${dotClass} ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1 w-24 rounded-md bg-muted/50 ${className}`}>
      <div className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className={`text-xs font-bold uppercase ${labelClass}`}>{label}</span>
    </div>
  );
}

export default RunningIndicator;
