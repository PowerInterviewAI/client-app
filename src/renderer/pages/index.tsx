import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppState } from '@/hooks/use-app-state';
import HomePage from '@/pages/home';

export default function IndexPage() {
  const { appState } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    if (appState?.isLoggedIn === false) {
      navigate('/auth/login', { replace: true });
    }
  }, [appState?.isLoggedIn, navigate]);

  // Logged-out users are redirected above. Everyone else - including the brief window before
  // appState has loaded - sees the home dashboard directly; HomePage owns its own loading state
  // for that window instead of this route showing a separate spinner first.
  return <HomePage />;
}
