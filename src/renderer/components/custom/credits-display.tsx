import React from 'react';

import { useNow } from '@/hooks/use-now';
import { useT } from '@/i18n';
import { CREDITS_PER_MINUTE } from '@/lib/consts';
import {
  daysLeft,
  EXPIRY_WARNING_DAYS,
  planKey,
  type SubscriptionSummary,
} from '@/lib/subscription';
import { cn } from '@/lib/utils';

interface CreditsDisplayProps {
  /** The free-tier balance, in credits. */
  credits: number;
  subscription: SubscriptionSummary;
  llmModel?: string;
  /** From the backend ping; falls back to the compiled-in mirror while that has not arrived. */
  creditsPerMinute?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CreditsDisplay({
  credits,
  subscription,
  llmModel,
  creditsPerMinute,
  className,
  style,
}: CreditsDisplayProps) {
  return (
    <div className={cn('flex text-xs font-bold gap-2', className)} style={style}>
      {subscription.subscribed && subscription.expiresAt !== null ? (
        <SubscribedSummary subscription={subscription} expiresAt={subscription.expiresAt} />
      ) : (
        <FreeSummary credits={credits} creditsPerMinute={creditsPerMinute} />
      )}
      {llmModel && (
        <>
          <hr className="h-4 border border-border" />
          <span className="text-muted-foreground">{llmModel}</span>
        </>
      )}
    </div>
  );
}

function SubscribedSummary({
  subscription,
  expiresAt,
}: {
  subscription: SubscriptionSummary;
  expiresAt: number;
}) {
  const t = useT();
  const planLabel = t.creditsDisplay.planNames[planKey(subscription.plan)];
  const days = daysLeft(expiresAt, useNow());
  const ending = days <= EXPIRY_WARNING_DAYS;

  return (
    <>
      <span className="text-muted-foreground">{planLabel}</span>
      <hr className="h-4 border border-border" />
      <span className={ending ? 'text-yellow-600' : 'text-muted-foreground'}>
        {ending
          ? t.creditsDisplay.endsIn(days)
          : t.creditsDisplay.unlimitedUntil(t.creditsDisplay.date(expiresAt))}
      </span>
    </>
  );
}

function FreeSummary({
  credits,
  creditsPerMinute,
}: {
  credits: number;
  creditsPerMinute?: number;
}) {
  const t = useT();
  const availableMinutes = Math.floor(credits / (creditsPerMinute ?? CREDITS_PER_MINUTE));

  // Split into hours and minutes here and assembled in the locale, because which plural form
  // each number takes is a property of the language: `2 hours 15 mins` against
  // `2 часа 15 минут`, where 2 and 22 agree and 5 and 25 do not.
  const availableTime =
    availableMinutes > 0
      ? t.creditsDisplay.freeLeft(
          t.creditsDisplay.duration(Math.floor(availableMinutes / 60), availableMinutes % 60)
        )
      : credits > 0
        ? t.creditsDisplay.freeLeft(t.creditsDisplay.lessThanAMinute)
        : t.creditsDisplay.noFreeTimeLeft;

  return (
    <>
      <span className="text-muted-foreground">{t.creditsDisplay.freePlan}</span>
      <hr className="h-4 border border-border" />
      <span
        className={cn(
          availableMinutes >= 5
            ? 'text-muted-foreground'
            : availableMinutes >= 1
              ? 'text-yellow-600 animate-pulse'
              : 'text-destructive animate-pulse'
        )}
      >
        {availableTime}
      </span>
    </>
  );
}
