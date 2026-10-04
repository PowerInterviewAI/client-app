import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { InputPassword } from '@/components/custom/input-password';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import useAuth from '@/hooks/use-auth';
import { useT } from '@/i18n';
import { APP_NAME } from '@/lib/consts';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordPage() {
  const t = useT();
  const { forgotPassword, verifyPasswordResetCode, resetPassword, loading, error, setError } =
    useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  // The reset succeeded and the redirect is pending. The form stays on screen through that
  // gap with `loading` already back to false, so without this the button is live again and a
  // second click resends a code the backend has just spent - a guaranteed 401, toasting a
  // failure on top of the success the user is still reading.
  const [succeeded, setSucceeded] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    []
  );

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (await forgotPassword(email.trim())) {
      // Advances on success alone, and the copy on the next step is conditional ("if an
      // account exists"). The backend answers the same for a registered and an unregistered
      // address on purpose, so telling the user which one they typed here would hand back
      // exactly the account-enumeration oracle that design removes.
      setStep('code');
    } else {
      toast.error(t.auth.reset.sendFailed);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (await verifyPasswordResetCode(email.trim(), code.trim())) {
      setStep('password');
    } else {
      // Names no cause, because this step has more than one and the toast cannot tell them
      // apart. A rejection here is a bad or expired code most of the time, but it is also how
      // the rate limit and a deactivated account arrive, and asserting "invalid code" over
      // either of those sends the user to re-read a code that was never the problem. The
      // inline error carries the reason the server actually gave.
      toast.error(t.auth.reset.verifyFailed);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (succeeded) return;
    setError(null);
    if (password !== passwordConfirm) {
      setError(t.auth.passwordsDoNotMatch);
      return;
    }

    if (await resetPassword(email.trim(), code.trim(), password)) {
      setSucceeded(true);
      toast.success(t.auth.reset.succeeded);
      redirectTimer.current = setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } else {
      // The code was verified to reach this step, so the overwhelmingly likely cause is that
      // it expired or was spent in between. Retrying the same code cannot work, so the copy
      // sends them for a new one rather than telling them to try again.
      toast.error(t.auth.reset.failed);
    }
  };

  // Back to step one with the address kept and the code dropped. The code is the part that
  // goes stale, and the password step is otherwise a dead end: the layout renders this card
  // alone with no navigation of its own, so an expired code there would leave the user with
  // nothing on screen that can recover the flow.
  const startOver = () => {
    setError(null);
    setCode('');
    setPassword('');
    setPasswordConfirm('');
    setStep('email');
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t.auth.reset.title}</CardTitle>
        <CardDescription>{t.auth.reset.description(APP_NAME)}</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'email' && (
          <form onSubmit={submitEmail} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="text-sm block mb-1">
                {t.auth.fields.email}
              </label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                required
              />
            </div>

            {error && (
              <div role="alert" className="text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t.auth.reset.sending : t.auth.reset.sendResetCode}
            </Button>

            <div className="text-center">
              <Link to="/auth/login" className="text-sm underline">
                {t.auth.reset.backToSignIn}
              </Link>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={submitCode} className="space-y-4">
            <div>
              <label htmlFor="reset-code" className="text-sm block mb-1">
                {t.auth.fields.resetCode}
              </label>
              <p className="text-sm text-muted-foreground mb-2">{t.auth.reset.codeNotice(email)}</p>
              <Textarea
                id="reset-code"
                name="code"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={4}
                required
              />
            </div>

            {error && (
              <div role="alert" className="text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t.auth.reset.verifying : t.auth.reset.verify}
            </Button>

            <div className="flex justify-between text-sm">
              <button type="button" className="underline" disabled={loading} onClick={startOver}>
                {t.auth.reset.changeEmail}
              </button>
              <button
                type="button"
                className="underline"
                disabled={loading}
                onClick={async () => {
                  setError(null);
                  if (await forgotPassword(email.trim())) {
                    toast.success(t.auth.reset.codeResent);
                  } else {
                    toast.error(t.auth.reset.resendFailed);
                  }
                }}
              >
                {t.auth.reset.resendCode}
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={submitPassword} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t.auth.reset.signsYouOut}</p>

            <div>
              <label htmlFor="reset-password" className="text-sm block mb-1">
                {t.auth.fields.newPassword}
              </label>
              <InputPassword
                id="reset-password"
                name="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
                required
              />
            </div>

            <div>
              <label htmlFor="reset-password-confirm" className="text-sm block mb-1">
                {t.auth.fields.confirmNewPassword}
              </label>
              <InputPassword
                id="reset-password-confirm"
                name="confirm-password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                maxLength={128}
                required
              />
            </div>

            {error && (
              <div role="alert" className="text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading || succeeded} className="w-full">
              {loading
                ? t.auth.reset.saving
                : succeeded
                  ? t.auth.reset.done
                  : t.auth.reset.setNewPassword}
            </Button>

            {!succeeded && (
              <div className="flex justify-between text-sm">
                <button type="button" className="underline" disabled={loading} onClick={startOver}>
                  {t.auth.reset.startOver}
                </button>
                <Link to="/auth/login" className="underline">
                  {t.auth.reset.backToSignIn}
                </Link>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
