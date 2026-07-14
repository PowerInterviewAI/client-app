import { ChevronUp, CreditCard, Key, LogOut, Mail, Moon, SettingsIcon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppState } from '@/hooks/use-app-state';
import useAuth from '@/hooks/use-auth';
import { useThemeStore } from '@/hooks/use-theme-store';
import { RunningState } from '@/types/app-state';
import { type Config } from '@/types/config';

import { ChangePasswordDialog } from '../change-password-dialog';

interface ProfileGroupProps {
  config?: Config;
  onProfileClick: () => void;
  onSignOut: () => void;
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

export function ProfileGroup({
  config,
  onProfileClick,
  onSignOut,
  getDisabled,
}: ProfileGroupProps) {
  const navigate = useNavigate();
  const { runningState } = useAppState();
  const { changePassword, loading, error, setError } = useAuth();
  const { isDark, toggleTheme } = useThemeStore();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const disabled = getDisabled(runningState, true);

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    let res = false;
    try {
      if (await changePassword(currentPassword, newPassword)) {
        res = true;
      }
    } catch (err) {
      // Error is handled by the useAuth hook
      console.error('Password change failed:', err);
    }
    return res;
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled}
            variant="ghost"
            size="sm"
            className="w-32 rounded-md hover:bg-muted justify-start"
          >
            <div className="max-w-36 overflow-hidden flex items-center gap-2 text-foreground">
              <ChevronUp className="h-4 w-4" />
              <p className="text-sm font-medium truncate">
                {config?.interviewConf?.fullName || 'Settings'}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuItem onClick={() => toggleTheme()}>
            {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => !disabled && onProfileClick()} disabled={disabled}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            Configuration
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (disabled) return;
              setError(null);
              setIsChangePasswordOpen(true);
            }}
          >
            <Key className="mr-2 h-4 w-4" />
            Change password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/payment')} disabled={disabled}>
            <CreditCard className="mr-2 h-4 w-4" />
            Buy Credits
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => !disabled && onSignOut()} disabled={disabled}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            {config?.email}
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
        onChangePassword={handleChangePassword}
        loading={loading}
        error={error}
      />
    </div>
  );
}
