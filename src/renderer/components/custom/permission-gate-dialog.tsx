import { CheckCircle, Loader2, Mic, Monitor, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type PermStatus, usePermissions } from '@/hooks/use-permissions';
import { getElectron } from '@/lib/utils';

interface PermissionGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  proceedLabel?: string;
}

export default function PermissionGateDialog({
  open,
  onOpenChange,
  onProceed,
  proceedLabel = 'Start',
}: PermissionGateDialogProps) {
  const { status, loading, allGranted, recheck } = usePermissions(open);
  const [requesting, setRequesting] = useState(false);

  const requestMic = async () => {
    setRequesting(true);
    try {
      await getElectron()?.permissions.requestMicrophone();
      await recheck();
    } finally {
      setRequesting(false);
    }
  };

  const openSettings = (pane: 'microphone' | 'screen') => {
    getElectron()?.permissions.openSettings(pane);
  };

  const handleProceed = () => {
    onOpenChange(false);
    onProceed();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Permissions Required</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <PermissionRow
            icon={<Mic className="h-4 w-4" />}
            label="Microphone"
            status={status.mic}
            note={
              status.mic === 'unknown'
                ? 'Checking...'
                : status.mic === 'granted'
                  ? 'Access granted'
                  : status.mic === 'denied' || status.mic === 'restricted'
                    ? 'Enable in System Settings, then click Check Again'
                    : 'Required to capture your voice'
            }
            action={
              status.mic === 'not-determined' ? (
                <Button size="sm" onClick={requestMic} disabled={requesting}>
                  Grant Access
                </Button>
              ) : status.mic === 'denied' || status.mic === 'restricted' ? (
                <Button size="sm" variant="outline" onClick={() => openSettings('microphone')}>
                  Open Settings
                </Button>
              ) : null
            }
          />

          <PermissionRow
            icon={<Monitor className="h-4 w-4" />}
            label="Screen Recording"
            status={status.screen}
            note={
              status.screen === 'unknown'
                ? 'Checking...'
                : status.screen === 'granted'
                  ? 'Access granted'
                  : status.screen === 'not-determined'
                    ? 'Will be requested when recording starts'
                    : 'Enable in System Settings, then click Check Again'
            }
            action={
              status.screen === 'denied' || status.screen === 'restricted' ? (
                <Button size="sm" variant="outline" onClick={() => openSettings('screen')}>
                  Open Settings
                </Button>
              ) : null
            }
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={recheck} disabled={loading}>
            {loading ? 'Checking...' : 'Check Again'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleProceed} disabled={!allGranted || loading}>
            {proceedLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionRow({
  icon,
  label,
  status,
  note,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  status: PermStatus;
  note: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{label}</span>
          {status === 'granted' ? (
            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
          ) : status === 'unknown' ? (
            <Loader2 className="h-3.5 w-3.5 text-muted-foreground/40 animate-spin shrink-0" />
          ) : status === 'not-determined' ? (
            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
      </div>
      {action && <div className="shrink-0 ml-2">{action}</div>}
    </div>
  );
}
