import { useState } from 'react';
import { toast } from 'sonner';

import { ChangePasswordDialog } from '@/components/custom/change-password-dialog';
import PageHeader from '@/components/custom/page-header';
import {
  ContextField,
  FullNameField,
  ProfileField,
} from '@/components/custom/settings/profile-fields';
import { Button } from '@/components/ui/button';
import { useAccountForm } from '@/hooks/use-account-form';
import { useAppState } from '@/hooks/use-app-state';
import useAuth from '@/hooks/use-auth';
import { useConfigStore } from '@/hooks/use-config-store';
import { useT } from '@/i18n';

/**
 * Who you are: the sign-in identity, the profile and job context every suggestion is written
 * from, and the password.
 *
 * Split from the configuration page rather than left as two tabs of one Settings screen. These
 * are the two questions a user actually arrives with - "change something about my account" and
 * "change how the interview runs" - and they have nothing in common beyond both being settings.
 * The split is what lets the home page name them as two buttons that say what they do.
 */
export default function AccountPage() {
  const t = useT();
  const { config } = useConfigStore();
  const { appState } = useAppState();
  const { changePassword, loading: authLoading, error: authError, setError } = useAuth();
  const form = useAccountForm();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleSave = async () => {
    try {
      await form.save();
      toast.success(t.account.saved);
    } catch (error) {
      console.error('Failed to save your account details:', error);
      toast.error(error instanceof Error ? error.message : t.account.saveFailed);
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      return await changePassword(currentPassword, newPassword);
    } catch (err) {
      console.error('Password change failed:', err);
      return false;
    }
  };

  return (
    <div className="w-full flex flex-col bg-background">
      <PageHeader title={t.account.title} />

      <div className="flex-1 overflow-auto px-4 py-4 w-full max-w-2xl mx-auto space-y-6">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{t.account.signedInAs}</p>
          {/* The account's own email rather than the remembered credential, which is blank for
              a user who declined "remember me" - see `AppState.accountEmail`. */}
          <p className="truncate text-sm font-medium">
            {appState?.accountEmail || config?.email || t.common.loading}
          </p>
        </div>

        <FullNameField form={form} />
        <ProfileField form={form} />
        <ContextField form={form} />

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">{t.account.password.title}</p>
            <p className="text-xs text-muted-foreground">{t.account.password.description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              setIsChangePasswordOpen(true);
            }}
          >
            {t.account.password.action}
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-3">
          {form.loading && (
            <p className="mr-auto text-xs text-muted-foreground">{t.common.loading}</p>
          )}
          {!form.loading && !form.loaded && (
            <p className="mr-auto text-xs text-destructive">{t.account.loadFailed}</p>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={form.saving || form.loading || !form.loaded || !form.isComplete}
          >
            {form.saving ? t.account.saving : t.account.save}
          </Button>
        </div>
      </div>

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
        onChangePassword={handleChangePassword}
        loading={authLoading}
        error={authError}
      />
    </div>
  );
}
