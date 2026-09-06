import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppState } from '@/hooks/use-app-state';
import HomePage from '@/pages/home';

export default function IndexPage() {
  const { appState } = useAppState();
  const navigate = useNavigate();

  const isLoggedIn = appState?.isLoggedIn;
  const accountLoaded = appState?.interviewConfigLoaded ?? false;
  const onboardingCompleted = appState?.onboardingCompleted ?? false;

  useEffect(() => {
    if (isLoggedIn === false) {
      navigate('/auth/login', { replace: true });
      return;
    }

    // Gated on `interviewConfigLoaded`, not only on the flag. The flag lives on the account, so
    // until that account has actually been read this session its value is the default rather
    // than an answer - acting on it earlier would flash the wizard at every signed-in user for
    // the frames before their account arrives, and would show it in full to anyone whose pull
    // failed.
    if (isLoggedIn === true && accountLoaded && !onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [isLoggedIn, accountLoaded, onboardingCompleted, navigate]);

  // Logged-out users and first-run users are redirected above. Everyone else - including the
  // brief window before appState has loaded - sees the home dashboard directly; HomePage owns its
  // own loading state for that window instead of this route showing a separate spinner first.
  return <HomePage />;
}
