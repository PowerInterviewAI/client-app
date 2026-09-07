import {
  BookOpen,
  Home,
  LogOut,
  Mail,
  Menu,
  Moon,
  SettingsIcon,
  Sun,
  UserRound,
} from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import useAuth from '@/hooks/use-auth';
import { useConfigStore } from '@/hooks/use-config-store';
import { useInterviewLock } from '@/hooks/use-interview-lock';
import { useSaveHistoryGuard } from '@/hooks/use-save-history-guard';
import { useThemeStore } from '@/hooks/use-theme-store';

interface TitlebarMenuProps {
  style?: React.CSSProperties;
  /** Closed for the length of an interview - see the trigger's own note in `titlebar.tsx`. */
  disabled?: boolean;
}

export default function TitlebarMenu({ style, disabled: closed = false }: TitlebarMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { appState } = useAppState();
  const { config } = useConfigStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { logout } = useAuth();
  const { confirmDiscard } = useSaveHistoryGuard();

  const isLoggedIn = appState?.isLoggedIn ?? false;
  // Every item here either navigates or rewrites state a running session depends on, and both
  // are refused mid-interview - so the whole menu is closed rather than each entry disabled
  // individually. `useInterviewLock` counts a mock session, which cannot be read off
  // `runningState`: a mock deliberately leaves that on Idle, and the check that missed it let
  // the candidate sign out from under an interviewer that was mid-question.
  const { locked } = useInterviewLock();
  const disabled = locked;

  // First-run setup owns the window while it is running. Home bounces straight back here until
  // the wizard is finished or skipped, and Account and Configuration are the two things it is in
  // the middle of collecting - so offering all three would be three menu items that look broken.
  // Skip is the way out, and it is on the screen itself where it can say what skipping costs.
  //
  // Only for the compulsory run. The same route reached from Configuration's *Run setup* is an
  // ordinary page the user chose to open, and taking their navigation away there would be the
  // menu breaking rather than the menu declining to lie.
  const inSetup = location.pathname === '/onboarding' && !(appState?.onboardingCompleted ?? false);

  const handleSignOut = async () => {
    // Asked for the same reason Clear, Start, Stop and closing the app ask: signing out drops the
    // interview from main-process memory, and nothing has written it to disk unless it was
    // exported. It was the one path that destroyed it silently.
    if (!(await confirmDiscard('signout'))) return;

    try {
      await logout();
    } catch (err) {
      // Read the message off the caught error rather than the `error` state above - `logout`
      // sets it and throws in the same tick, so this closure's `error` is still last render's
      // (stale) value.
      console.error('Sign out failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  return (
    // Non-modal: a modal menu locks body pointer events, and items here change route or open a
    // dialog, either of which can unmount the menu before it releases the lock.
    <DropdownMenu modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex" style={style}>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Menu"
                disabled={closed}
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <Menu className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{closed ? 'Unavailable during an interview' : 'Menu'}</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" side="bottom">
        {isLoggedIn && (
          <>
            <DropdownMenuLabel className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              {appState?.accountEmail || config?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!inSetup && (
              <>
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </DropdownMenuItem>
                {/* The same two destinations the home page names, in the same words. Account is
                    disabled mid-session because saving a new profile rewrites state the running
                    assistant reads; configuration is not, because every control on it is meant
                    to be changed during an interview. */}
                <DropdownMenuItem
                  onClick={() => !disabled && navigate('/account')}
                  disabled={disabled}
                >
                  <UserRound className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/configuration')}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Configuration
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
        <DropdownMenuItem onClick={() => toggleTheme()}>
          {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/documentation')}>
          <BookOpen className="mr-2 h-4 w-4" />
          Documentation
        </DropdownMenuItem>

        {isLoggedIn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => !disabled && void handleSignOut()} disabled={disabled}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
