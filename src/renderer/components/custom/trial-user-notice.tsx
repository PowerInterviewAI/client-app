import { X } from 'lucide-react';

import { useT } from '@/i18n';

import { Button } from '../ui/button';

interface TrialUserNoticeProps {
  onClick: () => void;
}

export default function TrialUserNotice({ onClick }: TrialUserNoticeProps) {
  const t = useT();

  return (
    <div className="fixed top-11 left-1/2 -translate-x-1/2 bg-primary/10 backdrop-blur-sm text-foreground text-xs font-medium pl-4 pr-2 py-1 rounded-full shadow-xl z-50 border border-primary flex items-center gap-2">
      <span>
        {t.trialNotice.freeTierLead}
        <span className="font-bold">{t.trialNotice.freeTier}</span>
        {t.trialNotice.freeTierTail}
        <br />
        {t.trialNotice.sotaLead}
        <span className="font-bold">{t.trialNotice.sota}</span>
        {t.trialNotice.sotaTail}
      </span>
      <Button
        className="ml-1 rounded-full size-6 cursor-pointer shrink-0"
        aria-label={t.notices.dismiss}
        onClick={() => onClick()}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
