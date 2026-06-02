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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    try {
      if (await onChangePassword(currentPassword, newPassword)) {
        toast.success('Password changed successfully');
      } else {
        toast.error('Failed to change password');
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="current-password" className="text-sm font-medium">
              Current Password
            </label>
            <div className="relative">
              <InputPassword
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="new-password" className="text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <InputPassword
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirm New Password
            </label>
            <div className="relative">
              <InputPassword
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
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
            Cancel
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
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogFooter>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      </DialogContent>
    </Dialog>
  );
}
