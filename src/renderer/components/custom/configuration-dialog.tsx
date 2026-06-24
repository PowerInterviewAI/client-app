import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConfigStore } from '@/hooks/use-config-store';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface ConfigurationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ConfigurationDialog({ isOpen, onOpenChange }: ConfigurationDialogProps) {
  const { config, updateConfig } = useConfigStore();

  const [name, setName] = useState('');
  const [profileData, setProfileData] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Initialize form values when dialog opens - runs before paint
  useEffect(() => {
    if (!isOpen) return;

    // Queue state updates in a single microtask to avoid cascading renders
    Promise.resolve().then(() => {
      if (config?.interviewConf) {
        setName(config.interviewConf.username ?? '');
        setProfileData(config.interviewConf.profileData ?? '');
        setJobDescription(config.interviewConf.jobDescription ?? '');
      }
    });
  }, [isOpen, config?.interviewConf]);

  const handleSave = async () => {
    const interviewConf = {
      username: name,
      profileData: profileData,
      jobDescription: jobDescription,
    };
    try {
      await updateConfig({ interviewConf: interviewConf });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
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
                maxLength={60000}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Context (Recommended)
              </label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Enter the context you are targeting. (e.g. the job description, role requirements or any other information)"
                className="text-sm min-h-20 max-h-40 overflow-auto"
                maxLength={60000}
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
              disabled={name.trim() === '' || profileData.trim() === ''}
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
