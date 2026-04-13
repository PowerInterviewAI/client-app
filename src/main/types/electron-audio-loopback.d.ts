declare module 'electron-audio-loopback' {
  interface LoopbackPackage {
    initMain: () => void;
    enableLoopbackAudio: () => Promise<void>;
    disableLoopbackAudio: () => Promise<void>;
  }

  const loopbackPackage: LoopbackPackage;
  export default loopbackPackage;
}
