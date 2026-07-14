import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { InputPassword } from '@/components/custom/input-password';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import useAuth from '@/hooks/use-auth';

type Step = 'email' | 'code' | 'details';

export default function SignupPage() {
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
      toast.error('Failed to send verification code. Please try again.');
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (await verifyEmailCode(email.trim(), code.trim())) {
      setStep('details');
    } else {
      toast.error('Invalid or expired verification code.');
    }
  };

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (await signup(username.trim(), email.trim(), password, code.trim())) {
      toast.success('Signup successful! Please login.');
      // redirect to login page
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } else {
      toast.error('Signup failed. Please try again.');
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Register a new account for Power Interview AI</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'email' && (
          <form onSubmit={submitEmail} className="space-y-4">
            <div>
              <label className="text-sm block mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                required
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending…' : 'Send code'}
            </Button>

            <div className="text-center">
              <Link to="/auth/login" className="text-sm underline">
                Already have account? Just login
              </Link>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={submitCode} className="space-y-4">
            <div>
              <label className="text-sm block mb-1">Verification code</label>
              <p className="text-sm text-muted-foreground mb-2">
                We sent a verification code to {email}. Paste it below.
              </p>
              <Textarea value={code} onChange={(e) => setCode(e.target.value)} rows={4} required />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Verifying…' : 'Verify'}
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
                Change email
              </button>
              <button
                type="button"
                className="underline"
                disabled={loading}
                onClick={async () => {
                  setError(null);
                  if (await sendVerificationCode(email.trim())) {
                    toast.success('Verification code resent.');
                  } else {
                    toast.error('Failed to resend verification code.');
                  }
                }}
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={submitDetails} className="space-y-4">
            <div>
              <label className="text-sm block mb-1">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={50}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">Password</label>
              <InputPassword
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">Confirm Password</label>
              <InputPassword
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                maxLength={128}
                required
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
