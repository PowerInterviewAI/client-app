import { useLocation } from 'react-router-dom';

import { useAppState } from '@/hooks/use-app-state';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';

/**
 * The destinations the rail navigates between, and the only routes it is drawn on. The interview
 * routes are excluded because the navigation lock refuses every way off them anyway, and a column
 * of disabled icons beside the console would only take width from the suggestions. Auth and
 * onboarding are excluded because they are flows with their own way forward.
 */
export const RAIL_ROUTES = ['/', '/configuration', '/account', '/payment', '/documentation'];

export function useAppRailVisible(): boolean {
  const { pathname } = useLocation();
  const { appState } = useAppState();
  const isStealth = useIsStealthMode();

  return appState?.isLoggedIn === true && !isStealth && RAIL_ROUTES.includes(pathname);
}
