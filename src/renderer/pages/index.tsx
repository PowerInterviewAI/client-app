import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoadingPage } from '@/components/custom/loading';
import { useAppState } from '@/hooks/use-app-state';

export default function IndexPage() {
  const { appState } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to main page if backend is live and logged in
    if (appState?.isLoggedIn === false) {
      navigate('/auth/login', { replace: true });
    } else {
      navigate('/main', { replace: true });
    }
  }, [appState?.isBackendLive, appState?.isLoggedIn, navigate]);

  // Optionally, render a loading state while checking
  return <LoadingPage disclaimer="Loading…" />;
}
