import { Ellipsis, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { useObsCameraDevice, useVbCableInputDevice } from '@/hooks/use-special-devices';
import { useVideoDevices } from '@/hooks/use-video-devices';
import { RunningState } from '@/types/app-state';

import ExternalLink from '../external-link';

interface VideoGroupProps {
  videoDeviceNotFound: boolean;
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

export function VideoGroup({ videoDeviceNotFound, getDisabled }: VideoGroupProps) {
  const { runningState, appState } = useAppState();
  const { config, updateConfig } = useConfigStore();
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const videoDevices = useVideoDevices();
  const obsCameraDevice = useObsCameraDevice();
  const vbInputDevice = useVbCableInputDevice();
  const lowCredits = appState?.credits === undefined ? null : appState?.credits <= 0;

  const obsCameraExists = obsCameraDevice !== null;
  const vbInputExists = vbInputDevice !== null;

  useEffect(() => {
    // Disable face swap if required devices are not found
    if (!obsCameraExists && config?.faceSwap) {
      updateConfig({ faceSwap: false });
      toast.error('OBS Virtual Camera not found — disabling Face Swap');
    }
    if (!vbInputExists && config?.faceSwap) {
      updateConfig({ faceSwap: false });
      toast.error('VB-Audio Virtual Cable not found — disabling Face Swap');
    }
  }, [obsCameraExists, vbInputExists, config?.faceSwap, updateConfig]);

  useEffect(() => {
    if (lowCredits === true && config?.faceSwap) {
      updateConfig({ faceSwap: false });
      toast.error('Credits depleted — disabling Face Swap');
    }
  }, [lowCredits, config?.faceSwap, updateConfig]);

  const usableVideoDevices = videoDevices.filter((d) => {
    // exclude OBS virtual camera
    if (obsCameraDevice && d.deviceId === obsCameraDevice.deviceId) return false;
    if (d.label.toLowerCase().includes('virtual')) return false;
    return true;
  });

  // If no video device is selected but there are available devices, select the first one by default
  if ((config?.cameraDeviceName ?? '') === '') {
    if (usableVideoDevices.length > 0) {
      updateConfig({ cameraDeviceName: usableVideoDevices[0].label });
    }
  }

  useEffect(() => {
    // Only run when dialog is open
    if (!isVideoDialogOpen) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Media devices API unavailable');
      return;
    }

    let cleanupStream: MediaStream | null = null;
    let videoElement = videoPreviewRef.current;

    const startPreview = async () => {
      await new Promise((r) => requestAnimationFrame(r)); // wait for DOM to mount
      videoElement = videoPreviewRef.current;

      console.log('Starting video preview with config:', {
        camera_device_name: config?.cameraDeviceName,
        video_width: config?.videoWidth,
        video_height: config?.videoHeight,
      });

      // Stop previous stream before starting a new one
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
      }

      // Find camera device id by name
      const videoDeviceId = videoDevices.find(
        (d) => d.label === config?.cameraDeviceName
      )?.deviceId;
      console.log('Selected video device ID:', videoDeviceId);

      // Create media stream
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
          width: config?.videoWidth,
          height: config?.videoHeight,
        },
        audio: false,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        cleanupStream = stream;
        previewStreamRef.current = stream;
        if (videoElement) {
          videoElement.srcObject = stream;
          // Some browsers need play() after setting srcObject
          await videoElement.play().catch(() => {});
        } else {
          console.error('Video element not found for preview');
        }
      } catch (err) {
        toast.error('Unable to access camera');
        console.error(err);
      }
    };

    startPreview();

    // Cleanup when dialog closes or dependencies change
    return () => {
      if (cleanupStream) {
        cleanupStream.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [
    isVideoDialogOpen,
    config?.faceSwap,
    videoDevices,
    config?.cameraDeviceName,
    config?.videoWidth,
    config?.videoHeight,
  ]);

  return (
    <div className="relative">
      <div
        className={`flex items-center overflow-hidden rounded-full ${
          config?.faceSwap ? '' : 'text-white'
        }`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={config?.faceSwap ? 'secondary' : 'destructive'}
              size="icon"
              className="h-8 w-8 border-none rounded-none"
              disabled={
                getDisabled(runningState) ||
                ((!obsCameraExists || !vbInputExists) && !config?.faceSwap) ||
                lowCredits === true ||
                appState?.isGpuServerLive !== true
              }
              onClick={() => {
                const tryingToEnable = !config?.faceSwap;
                if (tryingToEnable && (!obsCameraExists || !vbInputExists)) {
                  alert('OBS Virtual Camera or VB-Audio Input not found. Face Swap requires both.');
                  return;
                }
                toast.success(config?.faceSwap ? 'Face Swap is Off' : 'Face Swap is On');
                updateConfig({ faceSwap: !config?.faceSwap });
              }}
            >
              <Users className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Face Swap ({config?.faceSwap ? 'On' : 'Off'})</p>
          </TooltipContent>
        </Tooltip>

        <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant={config?.faceSwap ? 'secondary' : 'destructive'}
                  size="icon"
                  className="h-8 w-8 rounded-none border-none"
                  disabled={getDisabled(runningState)}
                >
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Face Swap options</p>
            </TooltipContent>
          </Tooltip>

          <DialogContent className="flex flex-col w-md p-4 gap-4">
            <DialogTitle>Face Swap Options</DialogTitle>
            {appState?.isGpuServerLive !== true ? (
              <div className="text-sm text-yellow-700 dark:text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-md p-2">
                ⚙️ Allocating resources for <span className="font-semibold">Face Swap</span>… This
                may take several minutes.
                <br />
                Face Swap features will be available once initialization is complete.
              </div>
            ) : (
              <div className="text-sm text-green-700 dark:text-green-500 bg-green-500/10 border border-green-500/20 rounded-md p-2">
                You can use the <span className="font-semibold">Face Swap</span> feature for video
                calls.
              </div>
            )}

            {lowCredits === true && (
              <div className="text-sm text-destructive">
                Credits depleted.
                <br />
                Face Swap feature is disabled.
                <br />
                Please recharge credits to enable Face Swap.
              </div>
            )}

            {!obsCameraExists && (
              <div className="text-sm text-destructive">
                OBS Virtual Camera not found.
                <br />
                Face Swap feature requires OBS Virtual Camera.
                <br />
                Download and install OBS studio from
                <br />
                <ExternalLink href="https://obsproject.com/download" className="underline">
                  https://obsproject.com/download
                </ExternalLink>
                <br />
                and then restart this application.
              </div>
            )}
            {!vbInputExists && (
              <div className="text-sm text-destructive">
                VB-Audio Input device not found.
                <br />
                Audio Sync feature requires VB-Audio Virtual Cable.
                <br />
                Download and install VBCABLE Driver from
                <br />
                <ExternalLink href="https://vb-audio.com/Cable/" className="underline">
                  https://vb-audio.com/Cable/
                </ExternalLink>
              </div>
            )}

            {obsCameraExists && vbInputExists && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">IMPORTANT:</span> During video calls, make sure to
                  select{' '}
                  <ul className="list-disc ml-5">
                    <li>
                      <span className="font-medium italic">OBS Virtual Camera</span> as video input
                      device
                    </li>
                    <li>
                      <span className="font-medium italic">
                        CABLE Output (VB-Audio Virtual Cable)
                      </span>{' '}
                      as voice input device
                    </li>
                  </ul>
                  in the meeting platform (e.g. Zoom, Teams or Google Meet).
                  <br />
                  <span className="italic mt-1 block">
                    Do not select your physical camera or microphone for video calls.
                  </span>
                </div>

                {/* Camera Preview */}
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-64 h-36 mx-auto bg-black rounded-md object-contain"
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Camera Device Select */}
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Camera Device
                    </label>
                    <Select
                      value={`${config?.cameraDeviceName}`}
                      onValueChange={(v) => updateConfig({ cameraDeviceName: v })}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {usableVideoDevices.map((device) => (
                          <SelectItem key={device.label} value={device.label}>
                            {device.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resolution Select */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Resolution</label>
                    <Select
                      value={`${config?.videoWidth}x${config?.videoHeight}`}
                      onValueChange={(v) => {
                        const [w, h] = v.split('x').map(Number);
                        updateConfig({ videoWidth: w, videoHeight: h });
                      }}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        {['640x360', '640x480', '1280x720'].map((res) => (
                          <SelectItem key={res} value={res}>
                            {res}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Face Enhance Toggle */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm">
                      Face Enhance ({config?.enableFaceEnhance ? 'On' : 'Off'})
                    </span>
                    <Button
                      variant={config?.enableFaceEnhance ? 'default' : 'outline'}
                      size="sm"
                      className="w-16"
                      onClick={() =>
                        updateConfig({ enableFaceEnhance: !config?.enableFaceEnhance })
                      }
                    >
                      {config?.enableFaceEnhance ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      {videoDeviceNotFound && config?.faceSwap && (
        <Badge
          variant="destructive"
          className="absolute -bottom-1 -right-1 h-4 min-w-4 rounded-full px-1 flex items-center justify-center text-[10px] border"
        >
          !
        </Badge>
      )}
    </div>
  );
}
