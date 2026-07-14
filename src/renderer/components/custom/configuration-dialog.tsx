import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/hooks/use-app-state';
import { getElectron } from '@/lib/utils';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

// Kept in sync with the backend's MAX_PROFILE_DATA_LENGTH / MAX_CONTEXT_LENGTH (app/cfg/llm.py)
const MAX_FIELD_LENGTH = 128_000;

interface ConfigurationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ConfigurationDialog({ isOpen, onOpenChange }: ConfigurationDialogProps) {
  const { appState } = useAppState();

  const [name, setName] = useState('');
  const [profileData, setProfileData] = useState('');
  const [context, setContext] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize form values when dialog opens - runs before paint
  useEffect(() => {
    if (!isOpen) return;

    // Queue state updates in a single microtask to avoid cascading renders
    Promise.resolve().then(() => {
      if (appState?.interviewConfig) {
        setName(appState.interviewConfig.fullName ?? '');
        setProfileData(appState.interviewConfig.profileData ?? '');
        setContext(appState.interviewConfig.context ?? '');
      }
    });
  }, [isOpen, appState?.interviewConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const electron = getElectron();
      if (!electron?.account) {
        throw new Error('Electron API not available');
      }

      const result = await electron.account.update(name, profileData, context);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save configuration');
      }

      // Account update pushes a fresh app-state broadcast, so no manual refresh needed here
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Configuration</DialogTitle>
          <DialogDescription>
            Update your configuration: username, profile information (e.g. CV/resume) and interview
            context (e.g. job description).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-2">
          <div className="space-y-5">
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your profile name"
                className="text-sm"
                maxLength={100}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Profile <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={profileData}
                onChange={(e) => setProfileData(e.target.value)}
                placeholder="Enter your profile information. (e.g. your CV/resume, LinkedIn profile, or a brief bio)"
                className="text-sm min-h-20 max-h-40 overflow-auto"
                maxLength={MAX_FIELD_LENGTH}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Context (Recommended)
              </label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter the context you are targeting. (e.g. the job description, role requirements or any other information)"
                className="text-sm min-h-20 max-h-40 overflow-auto"
                maxLength={MAX_FIELD_LENGTH}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90"
              disabled={saving || name.trim() === '' || profileData.trim() === ''}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
