import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppState } from '@/hooks/use-app-state';
import { useOnboardingDismissed } from '@/hooks/use-onboarding-dismissed';
import HomePage from '@/pages/home';

export default function IndexPage() {
  const { appState } = useAppState();
  const navigate = useNavigate();

  // Read only. Clearing it belongs to `MainFrame`, which is mounted for every route and so sees
  // every sign-out - this one sees only the sign-outs that happen while it is on screen.
  const dismissed = useOnboardingDismissed((s) => s.dismissed);

  const isLoggedIn = appState?.isLoggedIn;
  const accountLoaded = appState?.interviewConfigLoaded ?? false;
  const onboardingCompleted = appState?.onboardingCompleted ?? false;

  useEffect(() => {
    if (isLoggedIn === false) {
      navigate('/auth/login', { replace: true });
      return;
    }

    // Three conditions, and each covers a different way of being wrong.
    //
    // `interviewConfigLoaded`: the flag lives on the account, so until that account has been
    // read this session its value is the default rather than an answer - acting sooner would
    // flash the wizard at every signed-in user on launch, and show it in full to anyone whose
    // pull failed.
    //
    // `dismissed`: the wizard's own write resolves over a different IPC message from the app
    // state that carries its result, so on the navigate home this still reads false. Without it
    // the user is sent straight back into the wizard they have just finished.
    if (isLoggedIn === true && accountLoaded && !onboardingCompleted && !dismissed) {
      navigate('/onboarding', { replace: true });
    }
  }, [isLoggedIn, accountLoaded, onboardingCompleted, dismissed, navigate]);

  // Logged-out users and first-run users are redirected above. Everyone else - including the
  // brief window before appState has loaded - sees the home dashboard directly; HomePage owns its
  // own loading state for that window instead of this route showing a separate spinner first.
  return <HomePage />;
}
