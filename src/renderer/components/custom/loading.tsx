import { Loader } from 'lucide-react';

import logoSvg from '/logo.svg';
import { APP_NAME } from '@/lib/consts';

interface LoadingProps {
  disclaimer: string;
}

export function LoadingPage({ disclaimer }: LoadingProps) {
  return (
    // `flex-1` rather than `h-screen`: this renders under the titlebar, and a full viewport height
    // below it overflowed by exactly the titlebar's height.
    <div className="flex w-full flex-1 items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-2.5">
          <img src={logoSvg} alt="" width={32} height={32} />
          <p className="text-xl font-semibold tracking-tight">{APP_NAME}</p>
        </div>
        <Loading disclaimer={disclaimer} />
      </div>
    </div>
  );
}

export function Loading({ disclaimer }: LoadingProps) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{disclaimer}</span>
    </div>
  );
}
