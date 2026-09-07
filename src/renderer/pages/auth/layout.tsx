import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { LoadingPage } from '@/components/custom/loading';
import { useAppState } from '@/hooks/use-app-state';

export default function AuthLayout() {
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

  // Show loading state while checking backend status
  if (appState?.isLoggedIn === false) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="w-full max-w-md mx-auto p-6">
          <Outlet />
        </div>
      </div>
    );
  } else {
    return <LoadingPage disclaimer="Loading…" />;
  }
}
