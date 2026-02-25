import React from 'react';

import { CREDITS_PER_MINUTE } from '@/lib/consts';
import { cn } from '@/lib/utils';

interface CreditsDisplayProps {
  credits: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CreditsDisplay({ credits, className, style }: CreditsDisplayProps) {
  const availableMinutes = Math.floor(credits / CREDITS_PER_MINUTE);
  const availableTime =
    availableMinutes <= 0
      ? credits > 0
        ? 'Less than 1 min'
        : 'No credits left'
      : `${availableMinutes.toLocaleString()} min${availableMinutes > 1 ? 's' : ''}`;

  return (
    <div
      className={cn(
        'text-xs font-bold',
        className,
        availableMinutes >= 5
          ? 'text-muted-foreground'
          : availableMinutes >= 1
            ? 'text-yellow-600 animate-pulse'
            : 'text-destructive animate-pulse'
      )}
      style={style}
    >
      {credits.toLocaleString()} credits ({availableTime})
    </div>
  );
}
