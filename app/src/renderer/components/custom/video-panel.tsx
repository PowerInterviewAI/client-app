import { UserCircle2 } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useAudioInputDevices } from '@/hooks/use-audio-devices';
import { useVbCableInputDevice } from '@/hooks/use-special-devices';
import { toast } from 'sonner';

import { useConfigStore } from '@/hooks/use-config-store';
import { useVideoDevices } from '@/hooks/use-video-devices';
import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

interface VideoPanelProps {
  runningState: RunningState;
  credits: number;
  // Optional: streaming fps for websocket
  fps?: number;
  jpegQuality?: number; // 0.0 - 1.0
}

export interface VideoPanelHandle {
  startWebRTC: () => Promise<void>;
  stopWebRTC: () => void;
}

export const VideoPanel = forwardRef<VideoPanelHandle, VideoPanelProps>(
  ({ runningState, credits, fps = 30, jpegQuality = 0.8 }, ref) => {
    const { config } = useConfigStore();
    const videoDevices = useVideoDevices();
    const audioInputDevices = useAudioInputDevices();
    const audioVbInput = useVbCableInputDevice();

    const cameraDeviceName = config?.cameraDeviceName ?? '';
    const videoWidth = config?.videoWidth ?? 1280;
    const videoHeight = config?.videoHeight ?? 720;

    const [videoMessage, setVideoMessage] = useState('Video Stream');
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const captureIntervalRef = useRef<number | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const reconnectAttemptsRef = useRef<number>(0);
    const isReconnectingRef = useRef<boolean>(false);
    const sendingRef = useRef<boolean>(false);
    const droppedRef = useRef<number>(0);

    const electron = getElectron();
    if (!electron) {
      throw new Error('Electron API not available');
    }

    const [isStreaming, setIsStreaming] = useState(false);

    const checkActiveVideoCodec = () => {
      if (!pcRef.current) return;

      try {
        const videoTransceiver = pcRef.current
          .getTransceivers()
          .find((t) => t.receiver.track?.kind === 'video');
        if (videoTransceiver) {
          const receiverParams = videoTransceiver.receiver.getParameters();
          const activeCodec = receiverParams.codecs?.[0];

          if (activeCodec) {
            console.log('Active video codec:', activeCodec);
            setVideoMessage(`Active codec: ${activeCodec.mimeType} (${activeCodec.clockRate}Hz)`);
          } else {
            console.log('No active video codec found');
          }
        }
      } catch (error) {
        console.error('Error checking active codec:', error);
      }
    };

    const checkSupportedVideoCodecs = () => {
      try {
        const videoCapabilities = RTCRtpSender.getCapabilities('video');
        console.log('Supported video codecs:', videoCapabilities?.codecs);
      } catch (error) {
        console.error('Error getting video capabilities:', error);
      }
    };

    // Check supported codecs on mount
    useEffect(() => {
      checkSupportedVideoCodecs();
    }, []);

    const scheduleReconnect = () => {
      if (runningState !== RunningState.Running) {
        console.log('Not reconnecting: runningState is not RUNNING');
        return;
      }

      if (isReconnectingRef.current) {
        console.log('Reconnect already scheduled');
        return;
      }

      isReconnectingRef.current = true;

      // Fixed delay for reconnection attempts to avoid overwhelming the system
      const delay = 5000;

      console.log(
        `Scheduling reconnect attempt #${reconnectAttemptsRef.current + 1} in ${delay}ms`
      );
      setVideoMessage(`Reconnecting in ${(delay / 1000).toFixed(0)}s...`);

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        isReconnectingRef.current = false;
        reconnectAttemptsRef.current += 1;

        console.log(`Attempting reconnect #${reconnectAttemptsRef.current}`);

        // Clean up existing connection before reconnecting
        if (pcRef.current) {
          try {
            pcRef.current.close();
          } catch (e) {
            console.warn('Error closing peer connection during reconnect:', e);
          }
          pcRef.current = null;
        }

        stopCaptureLoop();

        // Only reconnect if still in RUNNING state
        if (runningState === RunningState.Running) {
          startWebRTC().catch((err) => {
            console.error('Reconnect failed:', err);
            toast.error(`Connection to Face Swap service failed. Retrying...`);
            // Try again
            scheduleReconnect();
          });
        }
      }, delay);
    };

    const startWebRTC = async () => {
      if (pcRef.current) return;

      try {
        setVideoMessage('Waiting for processed video stream...');

        // Force use of TURN (relay) and register the provided TURN server
        const turnRes = await electron.webRtc.getTurnCredentials();
        const creds = turnRes.data;
        console.log('Received TURN credentials:', creds);
        if (!creds || !creds.username || !creds.credential || !creds.urls) {
          toast.error('Failed to get TURN server credentials');
          throw new Error('Invalid TURN credentials received');
        }

        const rtcConfig: RTCConfiguration = {
          // iceServers: [creds],
          // iceTransportPolicy: 'relay',
        };

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        // Monitor connection state for reconnection
        pc.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', pc.iceConnectionState);

          if (
            pc.iceConnectionState === 'failed' ||
            pc.iceConnectionState === 'disconnected' ||
            pc.iceConnectionState === 'closed'
          ) {
            console.warn('ICE connection failed/disconnected, scheduling reconnect');
            if (runningState === RunningState.Running) {
              scheduleReconnect();
            }
          } else if (
            pc.iceConnectionState === 'connected' ||
            pc.iceConnectionState === 'completed'
          ) {
            // Reset reconnect attempts on successful connection
            reconnectAttemptsRef.current = 0;
            console.log('ICE connection established, reset reconnect attempts');
          }
        };

        pc.onconnectionstatechange = () => {
          console.log('Connection state:', pc.connectionState);

          if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            console.warn('Connection failed/closed, scheduling reconnect');
            if (runningState === RunningState.Running) {
              scheduleReconnect();
            }
          } else if (pc.connectionState === 'connected') {
            // Reset reconnect attempts on successful connection
            reconnectAttemptsRef.current = 0;
            console.log('Connection established, reset reconnect attempts');
          }
        };

        // Monitor for errors
        pc.onicecandidateerror = (event) => {
          console.error('ICE candidate error:', event);
        };

        // Hold the remote stream when it arrives
        const remoteStream = new MediaStream();
        pc.ontrack = (event) => {
          // Add incoming tracks to remoteStream
          if (event.streams?.[0]) {
            const firstTrack = event.streams[0].getTracks()[0];
            if (firstTrack) {
              remoteStream.addTrack(firstTrack);

              // Monitor track for ended event
              firstTrack.onended = () => {
                console.warn('Remote video track ended, scheduling reconnect');
                if (runningState === RunningState.Running) {
                  scheduleReconnect();
                }
              };
            }
          } else if (event.track) {
            remoteStream.addTrack(event.track);

            // Monitor track for ended event
            event.track.onended = () => {
              console.warn('Remote video track ended, scheduling reconnect');
              if (runningState === RunningState.Running) {
                scheduleReconnect();
              }
            };
          }

          // Attach remote stream to media elements
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play().catch(() => {});
            // Start capture loop to compress frames to JPEG and send to main
            startCaptureLoop();
          }
          if (audioRef.current) {
            audioRef.current.srcObject = remoteStream;
            audioRef.current.play().catch(() => {});

            // attempt to route audio to VB‑Cable output if available
            if (
              audioVbInput &&
              audioVbInput.deviceId &&
              typeof audioRef.current.setSinkId === 'function'
            ) {
              audioRef.current.setSinkId(audioVbInput.deviceId).catch((err) => {
                console.warn('Failed to set sinkId for VB Cable audio output', err);
              });
            }
          }
        };

        // Find device ids from config selection
        const videoDeviceId = videoDevices.find((d) => d.label === cameraDeviceName)?.deviceId;
        const audioInputName = config?.audioInputDeviceName ?? '';
        const audioDeviceId = audioInputDevices.find((d) => d.name === audioInputName)?.deviceId;
        console.log('Selected devices', {
          [cameraDeviceName]: videoDeviceId,
          [audioInputName]: audioDeviceId,
        });

        // Acquire local camera/microphone for sending
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
            width: { ideal: videoWidth },
            height: { ideal: videoHeight },
            frameRate: { ideal: fps, max: fps },
          },
          audio: audioDeviceId
            ? { deviceId: { exact: audioDeviceId } }
            : { echoCancellation: false },
        });

        // if there is an audio track, add it to the peer connection as well
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          pc.addTrack(audioTrack, localStream);
        }

        // Get capabilities and prefer H264 first
        const caps = RTCRtpSender.getCapabilities('video');
        if (!caps) {
          toast.warning('Unable to get video capabilities');
          console.warn('No video capabilities available');
          return;
        }
        const h264Codecs = caps.codecs.filter(
          (c) =>
            c.mimeType.toLowerCase() === 'video/h264' &&
            c.sdpFmtpLine?.includes('profile-level-id=42c01e') // Constrained Baseline L3.0
        );
        const preferredCodecs = [...h264Codecs];

        // Create transceiver BEFORE attaching track
        const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });
        videoTransceiver.setCodecPreferences(preferredCodecs);

        // Attach camera track to transceiver
        const videoTrack = localStream.getVideoTracks()[0];
        await videoTransceiver.sender.replaceTrack(videoTrack);

        const sender = videoTransceiver.sender;
        const params = sender.getParameters();

        let maxBitrate;
        if (videoWidth >= 1920) {
          maxBitrate = 3_500_000; // 1080p
        } else if (videoWidth >= 1280) {
          maxBitrate = 1_800_000; // 720p
        } else {
          maxBitrate = 500_000; // 640x480
        }

        params.encodings = [
          {
            maxBitrate,
            maxFramerate: fps,
          },
        ];

        params.degradationPreference = 'maintain-framerate';

        await sender.setParameters(params);

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send offer to server with face swap always enabled
        const res = await electron.webRtc.offer(offer);
        const answer = res.data;

        // Apply answer
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        setIsStreaming(true);

        // Check the active video codec
        checkActiveVideoCodec();
      } catch (error) {
        console.error('Error in startWebRTC:', error);

        // Clean up on error
        if (pcRef.current) {
          try {
            pcRef.current.close();
          } catch (e) {
            console.warn('Error closing peer connection after error:', e);
          }
          pcRef.current = null;
        }

        // Rethrow to trigger reconnection in scheduleReconnect
        throw error;
      }
    };

    const startCaptureLoop = () => {
      // avoid starting multiple loops
      if (captureIntervalRef.current) return;

      const canvas = document.createElement('canvas');
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      captureCanvasRef.current = canvas;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const intervalMs = Math.max(1000 / fps, 33); // cap to ~30fps min interval

      captureIntervalRef.current = window.setInterval(() => {
        try {
          // Backpressure: if a send/encode is in progress, drop frame
          if (sendingRef.current) {
            droppedRef.current += 1;
            // Log dropped frames periodically
            if (droppedRef.current % 30 === 0) {
              console.warn(`Dropped ${droppedRef.current} frames (backpressure)`);
            }
            return;
          }

          const videoEl = videoRef.current;
          if (!videoEl || videoEl.readyState < 2) return;

          // Mark as busy BEFORE starting encode
          sendingRef.current = true;

          // draw current frame
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

          // convert to JPEG blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                sendingRef.current = false;
                return;
              }
              // send ArrayBuffer to main process
              blob
                .arrayBuffer()
                .then(async (arrayBuffer) => {
                  try {
                    await electron.webRtc.putVideoFrame(arrayBuffer);
                  } catch (err) {
                    console.warn('Failed to send video frame to main:', err);
                  }
                })
                .catch((err) => {
                  console.error('Error converting blob to ArrayBuffer:', err);
                })
                .finally(() => {
                  // Release flag AFTER send completes
                  sendingRef.current = false;
                });
            },
            'image/jpeg',
            jpegQuality
          );
        } catch (err) {
          console.warn('Error in capture loop:', err);
          sendingRef.current = false;
        }
      }, intervalMs) as unknown as number;
    };

    const stopCaptureLoop = () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
      if (captureCanvasRef.current) {
        captureCanvasRef.current = null;
      }
      // Reset refs
      sendingRef.current = false;
      droppedRef.current = 0;
    };

    const stopWebRTC = () => {
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      isReconnectingRef.current = false;
      reconnectAttemptsRef.current = 0;

      // Close RTCPeerConnection
      if (pcRef.current) {
        try {
          pcRef.current.close();
          // eslint-disable-next-line no-empty
        } catch {}
        pcRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // stop capture loop
      stopCaptureLoop();

      setVideoMessage('Video Stream');
      setIsStreaming(false);
    };

    // Start/stop WebRTC on running state change
    useEffect(() => {
      if (runningState === RunningState.Running && config?.faceSwap) {
        // Automatically start WebRTC when running state is RUNNING
        startWebRTC().catch((err) => {
          console.error('Failed to start WebRTC:', err);
          // Trigger reconnection logic
          scheduleReconnect();
        });
      } else if (runningState === RunningState.Stopping || runningState === RunningState.Idle) {
        stopWebRTC();
      }
    }, [runningState]);

    // cleanup on unmount
    useEffect(() => {
      return () => stopWebRTC();
    }, []);

    // Close WebRTC and pause video when credits reach 0
    useEffect(() => {
      if (credits === 0 && runningState === RunningState.Running) {
        console.log('Credits depleted, stopping WebRTC');
        stopWebRTC();
        setVideoMessage('Out of credits');
        toast.warning('Out of credits - video paused');
      }
    }, [credits, runningState]);

    // ⚡ Expose functions to parent via ref
    useImperativeHandle(ref, () => ({
      startWebRTC,
      stopWebRTC,
    }));

    return (
      <div className="relative w-full h-full border rounded-xl overflow-hidden bg-white dark:bg-black shrink-0 py-0">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
        {/* hidden audio player for remote track routed to VB Cable */}
        <audio ref={audioRef} autoPlay hidden />

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
  }
);

VideoPanel.displayName = 'VideoPanel';
