import {
  BookOpen,
  EyeOff,
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
import { useThemeStore } from '@/hooks/use-theme-store';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';
import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

export default function TitlebarMenu({ style }: { style?: React.CSSProperties }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { appState, runningState } = useAppState();
  const { config } = useConfigStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { logout } = useAuth();

  const isLoggedIn = appState?.isLoggedIn ?? false;
  // Account actions rewrite state the running assistant depends on; theme, docs and stealth do not.
  const disabled = runningState !== RunningState.Idle;

  // First-run setup owns the window while it is running. Home bounces straight back here until
  // the wizard is finished or skipped, and Account and Configuration are the two things it is in
  // the middle of collecting - so offering all three would be three menu items that look broken.
  // Skip is the way out, and it is on the screen itself where it can say what skipping costs.
  //
  // Only for the compulsory run. The same route reached from Configuration's *Run setup* is an
  // ordinary page the user chose to open, and taking their navigation away there would be the
  // menu breaking rather than the menu declining to lie.
  const inSetup =
    location.pathname === '/onboarding' && !(appState?.onboardingCompleted ?? false);

  const handleToggleStealth = () => {
    const electron = getElectron();
    if (electron) {
      electron.toggleStealth();
    } else {
      console.warn('Electron API not available for toggling stealth mode');
    }
  };

  const handleSignOut = async () => {
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
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Menu"
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted"
              style={style}
            >
              <Menu className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Menu</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" side="bottom">
        {isLoggedIn && (
          <>
            <DropdownMenuLabel className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              {config?.email}
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleStealth}>
              <EyeOff className="mr-2 h-4 w-4" />
              Stealth mode ({HOTKEYS[Hotkey.ToggleStealth].combo})
            </DropdownMenuItem>
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
