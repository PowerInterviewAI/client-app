import { useState } from 'react';
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

type Step = 'email' | 'code' | 'details';

export default function SignupPage() {
  const t = useT();
  const { signup, sendVerificationCode, verifyEmailCode, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (await sendVerificationCode(email.trim())) {
      setStep('code');
    } else {
      toast.error(t.auth.signup.sendCodeFailed);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (await verifyEmailCode(email.trim(), code.trim())) {
      setStep('details');
    } else {
      toast.error(t.auth.signup.invalidCode);
    }
  };

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError(t.auth.passwordsDoNotMatch);
      return;
    }

    if (await signup(username.trim(), email.trim(), password, code.trim())) {
      toast.success(t.auth.signup.succeeded);
      // redirect to login page
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } else {
      toast.error(t.auth.signup.failed);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t.auth.signup.title}</CardTitle>
        <CardDescription>{t.auth.signup.description(APP_NAME)}</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'email' && (
          <form onSubmit={submitEmail} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="text-sm block mb-1">
                {t.auth.fields.email}
              </label>
              <Input
                id="signup-email"
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
              {loading ? t.auth.signup.sending : t.auth.signup.sendCode}
            </Button>

            <div className="text-center">
              <Link to="/auth/login" className="text-sm underline">
                {t.auth.signup.haveAccount}
              </Link>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={submitCode} className="space-y-4">
            <div>
              <label htmlFor="signup-code" className="text-sm block mb-1">
                {t.auth.fields.verificationCode}
              </label>
              {/*
                Conditional, like the reset wizard's step two, because the backend now answers
                the same whether or not the address already has an account. It sends a code to
                a free address and a "you already have one" notice to a taken one, so a flat
                "we sent a code" is wrong half the time - and stating which happened would put
                back over the UI the enumeration the endpoint was changed to remove.
              */}
              <p className="text-sm text-muted-foreground mb-2">
                {t.auth.signup.codeNotice(email)}
              </p>
              <Textarea
                id="signup-code"
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
              {loading ? t.auth.signup.verifying : t.auth.signup.verify}
            </Button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setError(null);
                  setCode('');
                  setStep('email');
                }}
              >
                {t.auth.signup.changeEmail}
              </button>
              <button
                type="button"
                className="underline"
                disabled={loading}
                onClick={async () => {
                  setError(null);
                  if (await sendVerificationCode(email.trim())) {
                    // Not "Verification code resent": a taken address gets the "you already
                    // have an account" notice resent instead, and this toast can no longer
                    // tell which one happened - see sendVerificationCode's docstring.
                    toast.success(t.auth.signup.requestResent);
                  } else {
                    toast.error(t.auth.signup.resendFailed);
                  }
                }}
              >
                {t.auth.signup.resendCode}
              </button>
            </div>

            {/*
              The copy above tells a user whose address is already registered to go and sign
              in, and this is the only step that had no way to do it - step one carries the
              same link. That did not matter while a taken address was stopped at step one by
              a 409; now it reaches this screen instead, so the link has to be here too, or
              the advice lands somewhere the user cannot act on it.
            */}
            <div className="text-center">
              <Link to="/auth/login" className="text-sm underline">
                {t.auth.signup.haveAccount}
              </Link>
            </div>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={submitDetails} className="space-y-4">
            <div>
              <label htmlFor="signup-username" className="text-sm block mb-1">
                {t.auth.fields.username}
              </label>
              <Input
                id="signup-username"
                name="username"
                type="text"
                autoComplete="nickname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={50}
                required
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="text-sm block mb-1">
                {t.auth.fields.password}
              </label>
              <InputPassword
                id="signup-password"
                name="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
                required
              />
            </div>

            <div>
              <label htmlFor="signup-password-confirm" className="text-sm block mb-1">
                {t.auth.fields.confirmPassword}
              </label>
              <InputPassword
                id="signup-password-confirm"
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

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t.auth.signup.creating : t.auth.signup.create}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
