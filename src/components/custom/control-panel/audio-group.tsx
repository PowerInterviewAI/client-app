import { DialogDescription } from '@radix-ui/react-dialog';
import { Mic } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { useConfigStore } from '@/hooks/use-config-store';
import { RunningState } from '@/types/app-state';
import { type AudioDevice } from '@/types/audio-device';

interface AudioGroupProps {
  audioInputDevices: AudioDevice[];
  audioInputDeviceNotFound: boolean;
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

export function AudioGroup({
  audioInputDevices,
  audioInputDeviceNotFound,
  getDisabled,
}: AudioGroupProps) {
  const [open, setOpen] = useState(false);
  const { runningState } = useAppState();
  const { config, updateConfig } = useConfigStore();
  const usableAudioInputDevices = audioInputDevices.filter((d) => {
    if (d.name.toLowerCase().includes('virtual')) return false;
    return true;
  });

  // If no audio input device is selected but there are available devices, select the first one by default
  if ((config?.audioInputDeviceName ?? '') === '') {
    if (usableAudioInputDevices.length > 0) {
      updateConfig({ audioInputDeviceName: usableAudioInputDevices[0].name });
    }
  }

  return (
    <div className="flex items-center">
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 border-none rounded-xl"
              disabled={getDisabled(runningState)}
              onClick={() => setOpen(true)}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Audio options</p>
          </TooltipContent>
        </Tooltip>
        {audioInputDeviceNotFound && (
          <Badge
            variant="destructive"
            className="absolute -bottom-1 -right-1 h-4 min-w-4 rounded-full px-1 flex items-center justify-center text-[10px] border"
          >
            !
          </Badge>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col w-72 p-4">
          <DialogTitle>Audio Options</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select physical microphone that you use.
          </DialogDescription>

          {/* Microphone Select */}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground mb-1 block">Microphone</label>
            <Select
              value={config?.audioInputDeviceName}
              onValueChange={(v) => updateConfig({ audioInputDeviceName: v })}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {usableAudioInputDevices.map((device) => (
                  <SelectItem key={device.name} value={`${device.name}`}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
