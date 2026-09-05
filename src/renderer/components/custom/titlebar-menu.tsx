import { BookOpen, EyeOff, LogOut, Mail, Menu, Moon, SettingsIcon, Sun } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { appState, runningState } = useAppState();
  const { config } = useConfigStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { logout } = useAuth();

  const isLoggedIn = appState?.isLoggedIn ?? false;
  // Account actions rewrite state the running assistant depends on; theme, docs and stealth do not.
  const disabled = runningState !== RunningState.Idle;

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
            {/* Account, password, and billing all live on the Settings page now - one
                  guessable entry point instead of three separate, unrelated-looking rows. */}
            <DropdownMenuItem
              onClick={() => !disabled && navigate('/settings')}
              disabled={disabled}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
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
