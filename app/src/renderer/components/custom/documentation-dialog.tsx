import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Hotkey, HOTKEY_LIST, HOTKEYS } from '@/lib/hotkeys';
import { cn } from '@/lib/utils';

import ExternalLink from './external-link';

interface DocumentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DocumentationDialog({ open, onOpenChange }: DocumentationDialogProps) {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.electronAPI?.autoUpdater
        .getVersion()
        .then((res) => {
          if (res?.success && res.version) setVersion(res.version);
        })
        .catch(() => {
          /* ignore */
        });
    } catch (e) {
      console.error('Failed to get app version:', e);
    }
  }, []);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Power Interview {version ? `v${version}` : ''}</DialogTitle>
          <DialogDescription>
            <p>
              Power Interview is an AI-powered assistant that enhances your interview experience
              with real-time reply suggestions, on-screen code recommendations, and an optional Face
              Swap feature.
            </p>
            <p className="mt-2 text-sm">
              For full documentation, visit{' '}
              <ExternalLink
                href="https://www.powerinterviewai.com/docs"
                className="text-primary underline"
              >
                powerinterviewai.com/docs
              </ExternalLink>
              .
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 overflow-auto flex-1">
          <h3 className="text-sm font-semibold mb-2">Hotkeys</h3>
          <div className="grid grid-cols-3 gap-2">
            {HOTKEY_LIST.map((hk) => {
              const info = HOTKEYS[hk];
              return (
                <React.Fragment key={hk}>
                  <div className="col-span-1">
                    <div
                      className={cn(
                        'px-2 py-1 rounded text-[11px] font-semibold min-w-22.5',
                        hk === Hotkey.StopAll
                          ? 'bg-destructive/80 text-primary-foreground'
                          : hk === Hotkey.ToggleStealth
                            ? 'bg-primary/80 text-primary-foreground'
                            : 'bg-muted'
                      )}
                    >
                      {info.combo}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm">{info.description}</div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
