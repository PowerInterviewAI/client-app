import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface TrialUserNoticeProps {
  onClick: () => void;
}

export default function TrialUserNotice({ onClick }: TrialUserNoticeProps) {
  return (
    <div className="fixed top-11 left-1/2 -translate-x-1/2 bg-primary/10 backdrop-blur-sm text-foreground text-xs font-medium pl-4 pr-2 py-1 rounded-full shadow-xl z-50 border border-primary flex items-center gap-2">
      <span>
        Trial plan: 1 hour of free usage with the{' '}
        <span className="font-semibold">Llama-4-Scout</span> model.
        <br /> Buy credits to unlock all models.
      </span>
      <Button
        variant="ghost"
        className="ml-1 rounded-full size-6 cursor-pointer bg-primary text-white hover:text-white shrink-0"
        onClick={() => onClick()}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
