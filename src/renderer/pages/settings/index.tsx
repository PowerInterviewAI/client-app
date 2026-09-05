import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ChangePasswordDialog } from '@/components/custom/change-password-dialog';
import { HotkeyCheatsheet } from '@/components/custom/hotkey-cheatsheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/hooks/use-app-state';
import useAuth from '@/hooks/use-auth';
import { useProfessionalMode } from '@/hooks/use-professional-mode';
import { useTranscriptPanel } from '@/hooks/use-transcript-panel';
import { getElectron } from '@/lib/utils';

// Kept in sync with the backend's MAX_PROFILE_DATA_LENGTH / MAX_CONTEXT_LENGTH (app/cfg/llm.py)
const MAX_FIELD_LENGTH = 128_000;
// Kept in sync with the backend's MAX_USERNAME_LENGTH (app/cfg/llm.py)
const MAX_NAME_LENGTH = 1_000;

/**
 * How much of a long field's budget is left, once it is close enough to matter.
 *
 * `maxLength` on a textarea truncates a paste silently, which for these two fields means a CV or
 * a job description arriving 2,000 characters shorter than the one the user copied, with nothing
 * on screen having said so. Hidden below the threshold: a counter over an empty box is noise,
 * and the limit is generous enough that most sessions never approach it.
 */
const LIMIT_NOTICE_RATIO = 0.9;

function FieldLimitNotice({ value, max }: { value: string; max: number }) {
  if (value.length < max * LIMIT_NOTICE_RATIO) return null;

  const atLimit = value.length >= max;
  return (
    <p
      className={`text-[11px] tabular-nums ${atLimit ? 'text-destructive' : 'text-muted-foreground'}`}
      // Announced when it changes rather than only on focus: the moment it matters is a paste
      // that was cut short, which is not a keystroke the user is watching the counter for.
      role="status"
    >
      {atLimit
        ? `Character limit reached (${max.toLocaleString()}). Extra text was not added.`
        : `${(max - value.length).toLocaleString()} characters left`}
    </p>
  );
}

type SettingsTab = 'account' | 'session' | 'shortcuts' | 'billing';

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appState } = useAppState();
  const { changePassword, loading: authLoading, error: authError, setError } = useAuth();
  const { enabled: professionalMode, toggle: toggleProfessionalMode } = useProfessionalMode();
  const { visible: transcriptVisible, toggle: toggleTranscriptVisible } = useTranscriptPanel();

  // A reload leaves this page as the first entry in the session history, where navigate(-1) has
  // nowhere to go and silently does nothing. React Router marks that entry with key 'default'.
  const handleBack = () => {
    if (location.key === 'default') navigate('/', { replace: true });
    else navigate(-1);
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [name, setName] = useState('');
  const [profileData, setProfileData] = useState('');
  const [context, setContext] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Loaded straight from main, rather than tracked app state - refreshes what another device may
  // have changed, and only marks configLoaded once it actually succeeds, so a late failure can't
  // silently make Save overwrite a good saved profile with an empty form.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setConfigLoaded(false);

    void (async () => {
      try {
        const result = await getElectron()?.account?.get();
        if (cancelled) return;

        if (result?.data) {
          setName(result.data.fullName);
          setProfileData(result.data.profileData);
          setContext(result.data.context);
        }
        setConfigLoaded(result?.success ?? false);
      } catch (error) {
        console.error('Failed to load configuration:', error);
        if (!cancelled) setConfigLoaded(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const electron = getElectron();
      if (!electron?.account) {
        throw new Error('Electron API not available');
      }

      // Trimmed on the way out, not just validated. The Save button is already gated on the
      // trimmed name being non-empty, so a name of pure whitespace could never be saved - but a
      // name with a trailing space could, and it is the string the prompts address the candidate
      // by. The same goes for a CV pasted with a leading blank line.
      const result = await electron.account.update(name.trim(), profileData.trim(), context.trim());
      if (!result.success) {
        throw new Error(result.error || 'Failed to save configuration');
      }

      toast.success('Settings saved');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
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

  const handleBuyCredits = () => navigate('/payment');

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as SettingsTab)}
      className="w-full flex flex-col bg-background"
    >
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleBack}
            className="flex items-center shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 className="text-sm font-semibold shrink-0">Settings</h1>
          <TabsList className="ml-auto">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="session">Session</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-4 w-full max-w-2xl mx-auto">
        <TabsContent value="account" className="mt-0 space-y-5">
          <div className="grid gap-2">
            <label
              htmlFor="config-full-name"
              className="text-xs font-medium text-muted-foreground mb-1.5 block"
            >
              Full Name{' '}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </label>
            <Input
              id="config-full-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your profile name"
              className="text-sm"
              maxLength={MAX_NAME_LENGTH}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <label htmlFor="config-profile" className="text-xs font-medium text-muted-foreground">
                Profile{' '}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </label>
              <FieldLimitNotice value={profileData} max={MAX_FIELD_LENGTH} />
            </div>
            <Textarea
              id="config-profile"
              required
              value={profileData}
              onChange={(e) => setProfileData(e.target.value)}
              placeholder="Enter your profile information. (e.g. your CV/resume, LinkedIn profile, or a brief bio)"
              className="text-sm min-h-32 max-h-80 overflow-auto"
              maxLength={MAX_FIELD_LENGTH}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <label htmlFor="config-context" className="text-xs font-medium text-muted-foreground">
                Context (Recommended)
              </label>
              <FieldLimitNotice value={context} max={MAX_FIELD_LENGTH} />
            </div>
            <Textarea
              id="config-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Enter the context you are targeting. (e.g. the job description, role requirements or any other information)"
              className="text-sm min-h-32 max-h-80 overflow-auto"
              maxLength={MAX_FIELD_LENGTH}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground">Change your account password</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setIsChangePasswordOpen(true);
              }}
            >
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            {loading && <p className="mr-auto text-xs text-muted-foreground">Loading...</p>}
            {!loading && !configLoaded && (
              <p className="mr-auto text-xs text-destructive">
                Could not load your saved configuration. Reconnect before editing.
              </p>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={
                saving ||
                loading ||
                !configLoaded ||
                name.trim() === '' ||
                profileData.trim() === ''
              }
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="session" className="mt-0 space-y-4">
          <p className="text-xs text-muted-foreground">
            These carry over to your next session. Both can still be toggled from the control bar
            or their hotkey while a session is running.
          </p>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium">Professional mode</p>
              <p className="text-xs text-muted-foreground">
                Short hints (headline + keyword bullets) instead of full sentences
              </p>
            </div>
            <Checkbox checked={professionalMode} onCheckedChange={() => toggleProfessionalMode()} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium">Show transcript panel</p>
              <p className="text-xs text-muted-foreground">
                Keep the transcription dock visible during a session
              </p>
            </div>
            <Checkbox
              checked={transcriptVisible}
              onCheckedChange={() => toggleTranscriptVisible()}
            />
          </label>
        </TabsContent>

        <TabsContent value="shortcuts" className="mt-0">
          <HotkeyCheatsheet />
        </TabsContent>

        <TabsContent value="billing" className="mt-0 space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Credits</p>
              <p className="text-xs text-muted-foreground">Your remaining balance</p>
            </div>
            <p className="text-lg font-semibold tabular-nums">{appState?.credits ?? '—'}</p>
          </div>
          <Button onClick={handleBuyCredits} className="w-full">
            Buy Credits
          </Button>
        </TabsContent>
      </div>

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
        onChangePassword={handleChangePassword}
        loading={authLoading}
        error={authError}
      />
    </Tabs>
  );
}
