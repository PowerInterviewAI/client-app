import { Check } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAccountForm } from '@/hooks/use-account-form';
import { useAppState } from '@/hooks/use-app-state';
import useAuth from '@/hooks/use-auth';
import { useConfigStore } from '@/hooks/use-config-store';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

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

      <div className="flex-1 overflow-auto px-6 py-6 w-full max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t.account.signedInAs}</p>
          {/* The account's own email rather than the remembered credential, which is blank for
              a user who declined "remember me" - see `AppState.accountEmail`. */}
          <p className="truncate text-sm font-medium">
            {appState?.accountEmail || config?.email || t.common.loading}
          </p>
        </div>

        {form.loading ? (
          // Shaped like the three fields it stands in for, so nothing jumps when they arrive.
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : (
          <>
            {form.loaded && <ProfileCompleteness form={form} />}
            <FullNameField form={form} />
            <ProfileField form={form} />
            <ContextField form={form} />
          </>
        )}

        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
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

/**
 * How much of what suggestions are written from has been filled in. Nothing else on the screen
 * says that the profile and context are what make answers sound like the candidate, so an empty
 * CV field otherwise looks optional - and the start check only insists on the name and the CV.
 */
function ProfileCompleteness({ form }: { form: ReturnType<typeof useAccountForm> }) {
  const t = useT();
  const items = [
    { label: t.profileFields.fullName, done: form.fullName.trim() !== '' },
    { label: t.profileFields.profile, done: form.profileData.trim() !== '' },
    { label: t.profileFields.context, done: form.context.trim() !== '' },
  ];
  const done = items.filter((i) => i.done).length;
  const complete = done === items.length;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">
          {complete
            ? t.account.completeness.complete
            : t.account.completeness.title(done, items.length)}
        </p>
        <div className="flex gap-1" aria-hidden="true">
          {items.map((item) => (
            <span
              key={item.label}
              className={cn(
                'h-1.5 w-8 rounded-full transition-colors',
                item.done ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>
      {!complete && (
        <>
          <p className="mt-1 text-xs text-muted-foreground">{t.account.completeness.hint}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {items.map((item) => (
              <li
                key={item.label}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
                  item.done ? 'border-primary/30 text-foreground' : 'text-muted-foreground'
                )}
              >
                <Check
                  className={cn('h-3 w-3', item.done ? 'text-primary' : 'opacity-30')}
                  aria-hidden="true"
                />
                {item.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
