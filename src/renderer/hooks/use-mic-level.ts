import { type RefObject, useEffect, useRef } from 'react';

/**
 * A live 0-1 microphone level, written to a ref rather than React state.
 *
 * The level changes many times a second, and nothing that renders off it needs a React re-render
 * per frame - the session screen's listening indicator reads this ref directly inside its own
 * `requestAnimationFrame` loop and writes to the DOM itself. Driving that through `useState` would
 * re-render the whole session screen at animation-frame rate for a value only one small element
 * ever displays.
 *
 * Builds its own `AudioContext` for analysis, separate from the one `AudioWsStream` uses for PCM
 * capture - level metering has none of the sample-rate sensitivity that context's conversion does,
 * so sharing it would buy nothing and would tie this hook's lifecycle to the capture service's.
 */
export function useMicLevel(stream: MediaStream | null): RefObject<number> {
  const levelRef = useRef(0);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      levelRef.current = 0;
      return;
    }

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      levelRef.current = sum / data.length / 255;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      void ctx.close();
      levelRef.current = 0;
    };
  }, [stream]);

  return levelRef;
}
