import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { InputPassword } from '@/components/custom/input-password';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useAuth from '@/hooks/use-auth';
import { useSaveHistoryGuard } from '@/hooks/use-save-history-guard';
import { useT } from '@/i18n';

type Mode = 'idle' | 'change' | 'reset';

/**
 * The password row of the account card, opening in place rather than in a dialog.
 *
 * It carries its own forgotten-password path because the signed-out one cannot be reached from
 * here: `AuthLayout` sends a signed-in user straight back home, so a signed-in user who did not
 * remember the current password had no way forward at all.
 */
export function PasswordSection({ email }: { email: string }) {
  const t = useT();
  const { changePassword, forgotPassword, resetPassword, logout, loading, error, setError } =
    useAuth();
  const { confirmDiscard } = useSaveHistoryGuard();

  const [mode, setMode] = useState<Mode>('idle');
  const [currentPassword, setCurrentPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const close = () => {
    setMode('idle');
    setCurrentPassword('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  // A stale server error ("current password is incorrect") stays on screen while the user is
  // correcting the very field it is about, unless editing clears it.
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (error) setError(null);
  };

  // Both new fields are masked, so a mismatch is the one condition the user cannot see for
  // themselves. Held back until the confirm field has something in it.
  const passwordsMismatch = confirmPassword !== '' && newPassword !== confirmPassword;
  const newPasswordReady = newPassword !== '' && confirmPassword !== '' && !passwordsMismatch;
  const canSubmit =
    newPasswordReady && (mode === 'change' ? currentPassword !== '' : code.trim() !== '');

  const sendCode = async () => {
    setError(null);
    if (await forgotPassword(email)) {
      return true;
    }
    toast.error(t.auth.reset.sendFailed);
    return false;
  };

  const startReset = async () => {
    if (await sendCode()) {
      setCurrentPassword('');
      setMode('reset');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    if (mode === 'change') {
      if (await changePassword(currentPassword, newPassword)) {
        toast.success(t.changePassword.succeeded);
        close();
      }
      return;
    }

    // A reset ends every session on the account, this one included, so it is a sign-out and is
    // asked about like one - before the request, while declining still leaves everything intact.
    if (!(await confirmDiscard('signout'))) return;
    if (!(await resetPassword(email, code.trim(), newPassword))) return;

    toast.success(t.auth.reset.succeeded);
    // The token is already dead on the server. Signing out here takes the user to the sign-in
    // form now, rather than leaving them on a page whose next request fails as an expiry.
    // Main clears the local session even when the backend call fails, so its error is moot.
    try {
      await logout();
    } catch (err) {
      console.warn('Sign out after password reset failed:', err);
    }
  };

  if (mode === 'idle') {
    return (
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground dark:bg-white/[0.07]">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{t.account.password.title}</p>
          <p className="text-xs text-muted-foreground">{t.account.password.description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => {
            setError(null);
            setMode('change');
          }}
        >
          {t.account.password.action}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 px-5 py-4 animate-in fade-in-0 slide-in-from-top-1 duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{t.changePassword.title}</p>
          <p className="text-xs text-muted-foreground">
            {mode === 'change' ? t.changePassword.description : t.account.password.codeSent(email)}
          </p>
        </div>
      </div>

      {mode === 'change' ? (
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="current-password" className="text-sm font-medium">
              {t.changePassword.current}
            </label>
            <button
              type="button"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
              onClick={startReset}
              disabled={loading || !email}
            >
              {t.auth.signIn.forgotPassword}
            </button>
          </div>
          <InputPassword
            id="current-password"
            name="current-password"
            autoComplete="current-password"
            autoFocus
            value={currentPassword}
            onChange={(e) => edit(setCurrentPassword)(e.target.value)}
            placeholder={t.changePassword.currentPlaceholder}
            maxLength={128}
            disabled={loading}
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="reset-code" className="text-sm font-medium">
              {t.auth.fields.resetCode}
            </label>
            <button
              type="button"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
              disabled={loading}
              onClick={async () => {
                if (await sendCode()) toast.success(t.auth.reset.codeResent);
              }}
            >
              {t.auth.reset.resendCode}
            </button>
          </div>
          <Textarea
            id="reset-code"
            name="code"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => edit(setCode)(e.target.value)}
            rows={2}
            disabled={loading}
          />
        </div>
      )}

      <div className="grid gap-2 border-t border-border/60 pt-4">
        <label htmlFor="new-password" className="text-sm font-medium">
          {t.changePassword.next}
        </label>
        <InputPassword
          id="new-password"
          name="new-password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => edit(setNewPassword)(e.target.value)}
          placeholder={t.changePassword.nextPlaceholder}
          maxLength={128}
          disabled={loading}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="confirm-password" className="text-sm font-medium">
          {t.changePassword.confirm}
        </label>
        <InputPassword
          id="confirm-password"
          name="confirm-password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => edit(setConfirmPassword)(e.target.value)}
          placeholder={t.changePassword.confirmPlaceholder}
          maxLength={128}
          disabled={loading}
          aria-invalid={passwordsMismatch || undefined}
          aria-describedby={passwordsMismatch ? 'confirm-password-error' : undefined}
        />
        {passwordsMismatch && (
          <p id="confirm-password-error" role="alert" className="text-xs text-destructive">
            {t.changePassword.mismatch}
          </p>
        )}
      </div>

      {mode === 'reset' && (
        <p className="text-xs text-muted-foreground">{t.auth.reset.signsYouOut}</p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={close} disabled={loading}>
          {t.common.cancel}
        </Button>
        <Button type="submit" size="sm" disabled={!canSubmit || loading}>
          {mode === 'change'
            ? loading
              ? t.changePassword.submitting
              : t.changePassword.submit
            : loading
              ? t.auth.reset.saving
              : t.auth.reset.setNewPassword}
        </Button>
      </div>
    </form>
  );
}
