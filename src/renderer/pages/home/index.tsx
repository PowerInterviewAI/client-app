import { BookOpen, CreditCard, Play, SettingsIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/hooks/use-app-state';
import { useConfigStore } from '@/hooks/use-config-store';

export default function HomePage() {
  const navigate = useNavigate();
  const { appState } = useAppState();
  const { config, isLoading: configLoading, loadConfig } = useConfigStore();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const email = config?.email;
  const credits = appState?.credits;
  // appState starts null before the first IPC round-trip resolves, and configLoading covers the
  // config fetch this page kicks off above - both need to settle before "no data" is trustworthy.
  const accountReady = !configLoading && appState !== null;
  const firstName = email?.split('@')[0];

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start an interview, or jump to your account below.
          </p>
        </div>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate('/main')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/main');
            }
          }}
          className="mb-6 cursor-pointer outline-none transition-colors hover:border-primary focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Play className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Start Interview</CardTitle>
                <CardDescription>
                  Transcribe and get live suggestions during your interview.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Account</p>
              <p className="text-sm font-medium truncate">
                {accountReady ? (email ?? 'Not signed in') : 'Loading…'}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Credits</p>
              <p className="text-sm font-medium">
                {accountReady ? (credits ?? 'Unavailable') : 'Loading…'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => navigate('/payment')}
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Buy Credits
            </Button>
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <SettingsIcon className="h-4 w-4" aria-hidden="true" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/documentation')}>
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}
