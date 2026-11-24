import { toast } from 'sonner';

import PageHeader from '@/components/custom/page-header';
import { PasswordSection } from '@/components/custom/settings/password-section';
import {
  ContextField,
  FullNameField,
  ProfileField,
} from '@/components/custom/settings/profile-fields';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccountForm } from '@/hooks/use-account-form';
import { useAppState } from '@/hooks/use-app-state';
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
  const form = useAccountForm();

  // The account's own email rather than the remembered credential, which is blank for a user who
  // declined "remember me" - see `AppState.accountEmail`.
  const email = appState?.accountEmail || config?.email || '';
  const displayName = appState?.interviewConfig?.fullName?.trim() || '';

  const handleSave = async () => {
    try {
      await form.save();
      toast.success(t.account.saved);
    } catch (error) {
      console.error('Failed to save your account details:', error);
      toast.error(error instanceof Error ? error.message : t.account.saveFailed);
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden bg-background">
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageHeader title={t.account.title} />

        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-2xl space-y-5 px-6 py-6">
            {/* Sign-in identity and password together, ahead of the profile. The password used
                to sit between the profile fields and their Save button, which read as though
                Save covered it - it does not, the section changes it on its own. */}
            <section className="surface overflow-hidden rounded-2xl">
              <div className="flex items-center gap-4 p-5">
                <Avatar name={displayName} email={email} />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold tracking-tight">
                    {displayName || email || t.common.loading}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayName ? email : t.account.signedInAs}
                  </p>
                </div>
              </div>
              <div className="border-t border-border/60">
                <PasswordSection email={email} />
              </div>
            </section>

            <section className="surface overflow-hidden rounded-2xl">
              <div className="space-y-5 p-5">
                {form.loading ? (
                  // Shaped like the three fields it stands in for, so nothing jumps when they
                  // arrive.
                  <>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-9 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                  </>
                ) : (
                  <>
                    <FullNameField form={form} />
                    <ProfileField form={form} />
                    <ContextField form={form} />
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border/60 px-5 py-3">
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
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, email }: { name: string; email: string }) {
  const source = name || email.split('@')[0] || '';
  const initials =
    source
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => [...part][0]?.toUpperCase() ?? '')
      .join('') || '?';

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-base font-semibold text-primary"
    >
      {initials}
    </div>
  );
}
