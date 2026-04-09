import { UserCircle2 } from 'lucide-react';
import { forwardRef, useRef, useState } from 'react';

import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

interface VideoPanelProps {
  runningState: RunningState;
  credits: number;
  // Optional: streaming fps for websocket
  fps?: number;
  jpegQuality?: number; // 0.0 - 1.0
}

export interface VideoPanelHandle {}

export const VideoPanel = forwardRef<VideoPanelHandle, VideoPanelProps>(() => {
  const [videoMessage, setVideoMessage] = useState('Video Stream');
  const videoRef = useRef<HTMLVideoElement>(null);

  const electron = getElectron();
  if (!electron) {
    throw new Error('Electron API not available');
  }

  const [isStreaming, setIsStreaming] = useState(false);

  return (
    <div className="relative w-full h-full border rounded-xl overflow-hidden bg-white dark:bg-black shrink-0 py-0">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />

      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-gray-200 to-white dark:from-orange-950/50 dark:to-orange-950/20">
          <div className="text-center">
            <UserCircle2 className="mx-auto h-12 w-12 font-thin text-gray-500 dark:text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 text-xs">{videoMessage}</p>
          </div>
        </div>
      )}

      {isStreaming && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white/70 dark:bg-black/70 backdrop-blur px-2 py-1">
          <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-black dark:text-white text-xs font-medium">LIVE</span>
        </div>
      )}
    </div>
  );
});

VideoPanel.displayName = 'VideoPanel';
