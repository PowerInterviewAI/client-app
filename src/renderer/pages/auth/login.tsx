import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { InputPassword } from '@/components/custom/input-password';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import useAuth from '@/hooks/use-auth';
import { useConfigStore } from '@/hooks/use-config-store';
import { useT } from '@/i18n';
import { APP_NAME } from '@/lib/consts';

export default function LoginPage() {
  const t = useT();
  const { login, loading, error, setError } = useAuth();
  const { config, loadConfig, updateConfig } = useConfigStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Load saved credentials from Electron store
  useEffect(() => {
    const loadSavedCredentials = async () => {
      if (window.electronAPI?.auth) {
        try {
          const conf = await window.electronAPI.config.get();
          if (conf) {
            setRememberMe(conf.rememberMe ?? false);
            if (conf.rememberMe) {
              setEmail(conf.email || '');
              setPassword(conf.password || '');
            }
          }
        } catch (error) {
          console.error('Failed to load saved credentials:', error);
        }
      }
    };
    void loadSavedCredentials();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Persisting the remember-me choice must never block the sign-in attempt.
    try {
      await updateConfig({
        rememberMe,
        email: rememberMe ? email.trim() : '',
        password: rememberMe ? password : '',
      });
    } catch (err) {
      console.error('Failed to save remember-me preference:', err);
    }

    try {
      await login(email.trim(), password);
    } catch {
      // useAuth already set `error`, which is rendered below; nothing else to do here.
    }
  };

  useEffect(() => {
    // Pre-fill email from config (fallback if Electron API not available)
    if (config?.rememberMe) {
      setRememberMe(config.rememberMe);
      if (config?.email) {
        setEmail(config.email);
      }
      if (config?.password) {
        setPassword(config.password);
      }
    }
  }, [config?.email, config?.password, config?.rememberMe]);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t.auth.signIn.title}</CardTitle>
        <CardDescription>{t.auth.signIn.description(APP_NAME)}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-sm block mb-1">
              {t.auth.fields.email}
            </label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="text-sm block mb-1">
              {t.auth.fields.password}
            </label>
            <InputPassword
              id="login-password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={128}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <label
              htmlFor="remember-me"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {t.auth.signIn.rememberMe}
            </label>
          </div>

          {/* role=alert: the failure this renders is "Incorrect email or password", which arrives
              with no other change on screen. Without it a screen reader user submits the form and
              is told nothing at all. text-destructive rather than red-600 so it stays legible on
              the dark theme, where a fixed 600-weight red sits close to the card behind it. */}
          {error && (
            <div role="alert" className="text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? t.auth.signIn.submitting : t.auth.signIn.submit}
          </Button>

          <div className="text-center space-y-1">
            <div>
              <Link to="/auth/signup" className="text-sm underline">
                {t.auth.signIn.noAccount}
              </Link>
            </div>
            <div>
              <Link to="/auth/forgot-password" className="text-sm underline">
                {t.auth.signIn.forgotPassword}
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
