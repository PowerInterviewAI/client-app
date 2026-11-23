import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import faviconSvg from '/favicon.svg';
import { LoadingPage } from '@/components/custom/loading';
import { useAppState } from '@/hooks/use-app-state';
import { useT } from '@/i18n';
import { APP_NAME } from '@/lib/consts';

export default function AuthLayout() {
  const t = useT();
  const { appState } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    // Home, not `/main`. A user who has just signed in is the one most likely to have nothing
    // configured yet, and `/main` is the one screen that assumes everything already is - it is
    // also the route that skips the first-run wizard, which only `/` gates on.
    if (appState?.isLoggedIn === true) {
      navigate('/', { replace: true });
    }
  }, [appState?.isLoggedIn, navigate]);

  if (appState?.isLoggedIn !== false) {
    return <LoadingPage disclaimer={t.common.loading} />;
  }

  return (
    // `min-h-full` centring rather than a fixed-height flex box, so the signup steps - the tallest
    // card - scroll at the minimum window size instead of being clipped at the top.
    <div className="relative flex-1 overflow-x-hidden overflow-y-auto bg-background">
      {/* A soft brand glow behind the card, so the one thing on this screen has somewhere to sit
          instead of floating on a flat fill. Decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative flex min-h-full items-center justify-center">
        <div className="mx-auto w-full max-w-md px-6 py-8">
          <div className="mb-6 flex items-center justify-center gap-2.5">
            <img src={faviconSvg} alt="" className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          {/* The three auth screens each render their own Card; given a little more presence here
            rather than in three places. */}
          <div className="[&_[data-slot=card]]:rounded-2xl [&_[data-slot=card]]:shadow-xl [&_[data-slot=card]]:shadow-black/10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
