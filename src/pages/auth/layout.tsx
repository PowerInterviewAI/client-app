import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { LoadingPage } from '@/components/custom/loading';
import { useAppState } from '@/hooks/use-app-state';

export default function AuthLayout() {
  const { appState } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to main page if already logged in
    if (appState?.isLoggedIn === true) {
      navigate('/main', { replace: true });
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
