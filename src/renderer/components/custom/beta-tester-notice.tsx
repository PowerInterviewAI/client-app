import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface BetaTesterNoticeProps {
  expiresAt: number;
  onClick: () => void;
}

export default function BetaTesterNotice({ expiresAt, onClick }: BetaTesterNoticeProps) {
  return (
    <div className="fixed top-11 left-1/2 -translate-x-1/2 bg-primary/10 backdrop-blur-sm text-foreground text-xs font-medium pl-4 pr-1 py-1 rounded-full shadow-xl z-50 border border-primary flex items-center">
      Your BetaTester plan will expire on {new Date(expiresAt).toLocaleString()}
      <Button
        variant="ghost"
        className="ml-2 rounded-full size-6 cursor-pointer bg-primary text-white hover:text-white"
        onClick={() => onClick()}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
