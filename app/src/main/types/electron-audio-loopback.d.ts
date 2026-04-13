declare module 'electron-audio-loopback' {
  export function initMain(): void;
  export function enableLoopbackAudio(): Promise<void>;
  export function disableLoopbackAudio(): Promise<void>;
}
