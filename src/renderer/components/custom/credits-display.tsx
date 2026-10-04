import React from 'react';

import { useT } from '@/i18n';
import { CREDITS_PER_MINUTE } from '@/lib/consts';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/app-state';

interface CreditsDisplayProps {
  credits: number;
  llmModel?: string;
  userRole?: UserRole;
  /** From the backend ping; falls back to the compiled-in mirror while that has not arrived. */
  creditsPerMinute?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CreditsDisplay({
  credits,
  llmModel,
  userRole,
  creditsPerMinute,
  className,
  style,
}: CreditsDisplayProps) {
  const t = useT();

  // Not a real plan name - "Pro" is an actual purchasable SKU (see CreditPlan), so labeling
  // every non-trial user that way shows a starter or enterprise buyer a plan they never bought.
  const planLabel =
    userRole === UserRole.TrialUser ? t.creditsDisplay.trialPlan : t.creditsDisplay.paidPlan;
  const availableMinutes = Math.floor(credits / (creditsPerMinute ?? CREDITS_PER_MINUTE));

  // Split into hours and minutes here and assembled in the locale, because which plural form
  // each number takes is a property of the language: `2 hours 15 mins` against
  // `2 часа 15 минут`, where 2 and 22 agree and 5 and 25 do not.
  const formatDuration = (mins: number) =>
    t.creditsDisplay.duration(Math.floor(mins / 60), mins % 60);

  const availableTime =
    availableMinutes <= 0
      ? credits > 0
        ? t.creditsDisplay.lessThanAMinute
        : t.creditsDisplay.noCreditsLeft
      : formatDuration(availableMinutes);

  return (
    <div className={cn('flex text-xs font-bold gap-2', className)} style={style}>
      {userRole !== undefined && (
        <>
          <span className="text-muted-foreground">{planLabel}</span>
          <hr className="h-4 border border-border" />
        </>
      )}
      <span
        className={cn(
          availableMinutes >= 5
            ? 'text-muted-foreground'
            : availableMinutes >= 1
              ? 'text-yellow-600 animate-pulse'
              : 'text-destructive animate-pulse'
        )}
      >
        {t.creditsDisplay.summary(credits, availableTime)}
      </span>
      {llmModel && (
        <>
          <hr className="h-4 border border-border" />
          <span className="text-muted-foreground">{llmModel}</span>
        </>
      )}
    </div>
  );
}
