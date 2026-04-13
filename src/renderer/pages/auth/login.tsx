import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { InputPassword } from '@/components/custom/input-password';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import useAuth from '@/hooks/use-auth';
import { useConfigStore } from '@/hooks/use-config-store';

export default function LoginPage() {
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

    // Save remember me preference and credentials if checked
    await updateConfig({
      rememberMe,
      email: rememberMe ? email.trim() : '',
      password: rememberMe ? password : '',
    });

    await login(email.trim(), password);
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
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your account to access Power Interview</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm block mb-1">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm block mb-1">Password</label>
            <InputPassword
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Remember me
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

          <div className="text-center">
            <Link to="/auth/signup" className="text-sm underline">
              Don&apos;t have account? Create a new one.
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
