import React from 'react';

import { CREDITS_PER_MINUTE } from '@/lib/consts';
import { cn } from '@/lib/utils';

interface CreditsDisplayProps {
  credits: number;
  llmModel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function CreditsDisplay({ credits, llmModel, className, style }: CreditsDisplayProps) {
  const availableMinutes = Math.floor(credits / CREDITS_PER_MINUTE);

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    const parts: string[] = [];
    if (hours) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (remainder) parts.push(`${remainder} min${remainder > 1 ? 's' : ''}`);
    return parts.join(' ') || '0 mins';
  };

  const availableTime =
    availableMinutes <= 0
      ? credits > 0
        ? 'Less than 1 min'
        : 'No credits left'
      : formatDuration(availableMinutes);

  return (
    <div
      className={cn(
        'flex text-xs font-bold gap-2',
        className,
      )}
      style={style}
    >
      <span className={cn(
        availableMinutes >= 5
          ? 'text-muted-foreground'
          : availableMinutes >= 1
            ? 'text-yellow-600 animate-pulse'
            : 'text-destructive animate-pulse'
      )}>
        {credits.toLocaleString()} credits - {availableTime}
      </span>
      {llmModel && (
        <>
          <hr className="h-4 border border-border" />
          <span className='text-muted-foreground'>
            {llmModel}
          </span>
        </>
      )}
    </div>
  );
}
