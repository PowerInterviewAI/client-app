import { useState } from 'react';
import { toast } from 'sonner';

import { InputPassword } from '@/components/custom/input-password';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/i18n';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  onChangePassword,
  loading,
  error,
}: ChangePasswordDialogProps) {
  const t = useT();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    try {
      if (await onChangePassword(currentPassword, newPassword)) {
        toast.success(t.changePassword.succeeded);
      } else {
        toast.error(t.changePassword.failed);
      }
    } catch (err) {
      // Error is handled by parent component
      console.error('Password change failed:', err);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Clear form when closing
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    onOpenChange(newOpen);
  };

  const passwordsMismatch = confirmPassword !== '' && newPassword !== confirmPassword;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{t.changePassword.title}</DialogTitle>
          <DialogDescription>{t.changePassword.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="current-password" className="text-sm font-medium">
              {t.changePassword.current}
            </label>
            <div className="relative">
              <InputPassword
                id="current-password"
                name="current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t.changePassword.currentPlaceholder}
                maxLength={128}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="new-password" className="text-sm font-medium">
              {t.changePassword.next}
            </label>
            <div className="relative">
              <InputPassword
                id="new-password"
                name="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.changePassword.nextPlaceholder}
                maxLength={128}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              {t.changePassword.confirm}
            </label>
            <div className="relative">
              <InputPassword
                id="confirm-password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.changePassword.confirmPlaceholder}
                maxLength={128}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              loading
            }
          >
            {loading ? t.changePassword.submitting : t.changePassword.submit}
          </Button>
        </DialogFooter>
        {/* Says why the button is dead. A mismatch is the one condition above that the user
            cannot see from the fields themselves - both are masked - so without this the
            dialog silently refuses to submit and gives no reason. Held back until the confirm
            field has something in it, so it is not an error for a half-typed entry. */}
        {passwordsMismatch && (
          <div role="alert" className="text-sm text-destructive mt-2">
            {t.changePassword.mismatch}
          </div>
        )}
        {error && (
          <div role="alert" className="text-sm text-destructive mt-2">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
