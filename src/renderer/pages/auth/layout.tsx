import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import faviconSvg from '/favicon.svg';
import { AmbientBackground } from '@/components/custom/ambient-background';
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
    // The ambient background sits on a wrapper that does not scroll, so it stays put while the
    // card scrolls. `min-h-full` centring inside, so the signup steps - the tallest card - scroll
    // at the minimum window size instead of being clipped at the top.
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      <AmbientBackground animated />

      <div className="relative flex-1 overflow-x-hidden overflow-y-auto">
        <div className="flex min-h-full items-center justify-center">
          <div className="mx-auto w-full max-w-md px-6 py-8">
            <div className="mb-6 flex items-center justify-center gap-2.5">
              <img src={faviconSvg} alt="" className="h-8 w-8" />
              <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
            </div>
            {/* The three auth screens each render their own Card; given a little more presence
                here rather than in three places. Translucent so the background reads through. */}
            <div className="[&_[data-slot=card]]:rounded-2xl [&_[data-slot=card]]:bg-card/75 [&_[data-slot=card]]:shadow-xl [&_[data-slot=card]]:shadow-black/10 [&_[data-slot=card]]:backdrop-blur-xl">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
