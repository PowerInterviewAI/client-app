import {
  MOCK_TTS_CHUNK_TIMEOUT_MS,
  MOCK_TTS_GATE_MAX_HOLD_MS,
  MOCK_TTS_TAIL_MS,
} from '@/lib/consts';
import { getElectron } from '@/lib/utils';

/**
 * Mutes the candidate's microphone track while the interviewer's TTS audio is playing.
 *
 * This is the mechanism that keeps the interviewer's own voice out of the candidate's answer
 * transcript - closing the loopback-capture route (see `mock-transcription.service.ts`) leaves
 * exactly this one acoustic path in: the TTS voice comes out of the speakers, the microphone is
 * open, and without a gate the ASR would transcribe the question as something the candidate said.
 *
 * A stranded mute must be impossible, so this holds four independent layers:
 *   1. The caller wraps every play attempt in a `finally` that releases the gate - a rejected
 *      `play()`, a decode error, an abort, and a normal `ended` all reach it.
 *   2. A watchdog armed at `acquire()` force-releases past `MOCK_TTS_GATE_MAX_HOLD_MS`. An
 *      `HTMLAudioElement` that never fires `ended` or `error` is *not* what this covers -
 *      `playBlob`'s own `MOCK_TTS_CHUNK_TIMEOUT_MS` timer already rejects that case and reaches
 *      layer 1's `finally` well inside this watchdog's window. What is left uncovered by every
 *      other layer is a hang *before* any audio element exists: `fetchChunk`'s
 *      `electron.mockInterview.synthesizeChunk()` IPC call has no timeout of its own, so a stalled
 *      main process leaves the whole `await` chain suspended with nothing to reach a `finally`
 *      from. Precedent: `ACTION_LOCK_MAX_HOLD_MS` in `consts.ts`.
 *   3. `release()` takes the token `acquire()` returned, not a boolean, so a late release from a
 *      superseded acquisition cannot reopen the mic out from under a newer one.
 *   4. `forceReleaseNow()` is the state-driven belt `use-mock-interview.ts` calls whenever the
 *      broadcast state moves off `Speaking` for a reason other than normal playback completion.
 */
class MicGate {
  private track: MediaStreamTrack | null = null;
  private seq = 0;
  private tailTimer: number | null = null;
  private watchdogTimer: number | null = null;

  setTrack(track: MediaStreamTrack | null): void {
    this.track = track;
  }

  /** Mutes the track and returns the token this acquisition must present to `release()`. */
  acquire(): number {
    this.clearTimers();
    this.seq += 1;
    const mySeq = this.seq;
    if (this.track) this.track.enabled = false;
    this.watchdogTimer = window.setTimeout(() => {
      console.warn('[MicGate] watchdog fired - forcing the microphone back open');
      this.release(mySeq);
    }, MOCK_TTS_GATE_MAX_HOLD_MS);
    return mySeq;
  }

  /**
   * Release after `MOCK_TTS_TAIL_MS`, covering room reverb and Deepgram's own lookahead.
   * A token from a superseded acquisition is ignored - `forceReleaseNow` already handled it.
   */
  release(mySeq: number): void {
    if (mySeq !== this.seq) return;
    if (this.watchdogTimer !== null) {
      window.clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.tailTimer !== null) return;
    this.tailTimer = window.setTimeout(() => {
      this.tailTimer = null;
      if (this.track) this.track.enabled = true;
    }, MOCK_TTS_TAIL_MS);
  }

  /** Opens the mic immediately, regardless of token, and invalidates any acquisition in flight. */
  forceReleaseNow(): void {
    this.seq += 1;
    this.clearTimers();
    if (this.track) this.track.enabled = true;
  }

  private clearTimers(): void {
    if (this.watchdogTimer !== null) {
      window.clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.tailTimer !== null) {
      window.clearTimeout(this.tailTimer);
      this.tailTimer = null;
    }
  }
}

/**
 * Fetches and plays a mock-interview question's audio, one sentence chunk at a time.
 *
 * Main does the sentence splitting and the network call (see `speech-chunks.ts` and
 * `mockInterviewService.synthesizeChunk`); this only drives playback and requests chunk *n+1*
 * while chunk *n* plays, so time-to-first-audio is the first sentence rather than the whole
 * question. Chunks are cached per question so `Repeat question` costs no re-synthesis.
 */
class MockTtsService {
  private gate = new MicGate();
  private audio: HTMLAudioElement | null = null;
  private cache = new Map<number, Blob>();
  /** Synthesis requests still running, so two callers never bill the same chunk twice. */
  private inFlight = new Map<number, Promise<Blob | null>>();
  private playSeq = 0;
  /** Settles the promise of a playback `stop()` interrupted; null when nothing is playing. */
  private settleStoppedPlayback: (() => void) | null = null;
  /** Notified the moment a question's first chunk actually starts sounding. */
  private audioStartListeners = new Set<() => void>();

  /**
   * Fires when the interviewer's voice actually begins, not when playback is requested.
   *
   * The two are seconds apart: `playQuestion` has to synthesise the first sentence before there
   * is anything to play. The transcript panel reveals the question in step with this rather than
   * with the state change, so the words arrive with the voice instead of sitting on screen in
   * silence waiting for it.
   */
  onAudioStart(listener: () => void): () => void {
    this.audioStartListeners.add(listener);
    return () => {
      this.audioStartListeners.delete(listener);
    };
  }

  private notifyAudioStart(): void {
    for (const listener of this.audioStartListeners) {
      try {
        listener();
      } catch (e) {
        // A listener is a UI reveal, never something playback depends on.
        console.warn('[MockTtsService] audio-start listener threw', e);
      }
    }
  }

  setMicTrack(track: MediaStreamTrack | null): void {
    this.gate.setTrack(track);
  }

  /** Called whenever the question changes, so a long session does not accumulate every chunk. */
  resetCache(): void {
    this.cache.clear();
    // The in-flight map is keyed by index too, so a request still running for the old question
    // would otherwise be handed to the new one as its own chunk of the same number.
    this.inFlight.clear();
  }

  /** Plays every chunk in order, gating the mic for the duration, then reports the outcome. */
  async playQuestion(chunks: string[]): Promise<void> {
    const seq = ++this.playSeq;
    const electron = getElectron();
    if (!electron) return;

    // Supersede the element an older run is playing, without going through `stop()` - the gate
    // must stay shut across the handover, and `stop()` force-releases it. Bumping `playSeq` alone
    // only stops the *older loop* at its next check, which is after the chunk it is already
    // playing finishes: `Repeat question` is offered during `Speaking`, so pressing it left two
    // voices reading the question at once, and the first element - no longer `this.audio` -
    // unreachable by any later `stop()`.
    this.abortPlayback();

    const mySeq = this.gate.acquire();
    try {
      for (let i = 0; i < chunks.length; i++) {
        if (seq !== this.playSeq) return; // superseded - skip/end-interview/next question
        const blob = await this.getChunkBlob(i, chunks.length, seq);
        if (seq !== this.playSeq) return;
        if (!blob) throw new Error('Synthesis returned no audio');
        // Announced for the first chunk only, and from inside `playBlob` - see `onStarted`
        // there. Announcing it here, with the blob merely in hand, is what put the words on
        // screen ahead of the voice: decoding an MP3 and getting the output device going is not
        // free, and the reveal is timed against the first word being *heard*.
        await this.playBlob(blob, i === 0 ? () => this.notifyAudioStart() : undefined);
      }
      if (seq !== this.playSeq) return;
      await electron.mockInterview.speechFinished();
    } catch (error) {
      console.error('[MockTtsService] playback failed, falling back to text-only:', error);
      if (seq === this.playSeq) {
        await electron.mockInterview.speechFailed().catch(() => {});
      }
    } finally {
      // Unconditional, and the reason this is a `finally`: whatever happened above - a clean
      // finish, a synthesis failure, a decode error, a superseding stop() - the mic must reopen.
      this.gate.release(mySeq);
    }
  }

  /**
   * Aborts in-flight playback and forces the mic open. Used on Skip, End interview, and the
   * state-driven belt in `use-mock-interview.ts`.
   */
  stop(): void {
    this.playSeq += 1;
    this.abortPlayback();
    this.gate.forceReleaseNow();
  }

  /**
   * Tear down whatever is playing, leaving the gate exactly as it is.
   *
   * The two callers want opposite things from the microphone - `stop()` opens it, `playQuestion`
   * is about to shut it for the next question - and only this half is common to both.
   *
   * `pause()` fires neither `ended` nor `error`, so settling the promise is this function's real
   * work: without it the one `playBlob` handed back never resolves or rejects, its object URL is
   * never revoked, and `playQuestion` never reaches its own `finally`. The gate survives that
   * (`stop()` force-releases and the watchdog backs it up), but a blob and a parked async frame
   * leak on every stop, and a session stops often.
   */
  private abortPlayback(): void {
    if (this.audio) {
      try {
        this.audio.pause();
      } catch {
        // noop - the element is being discarded either way
      }
      this.audio = null;
    }
    this.settleStoppedPlayback?.();
  }

  /**
   * Both writes carry the generation they were started under, because the cache is keyed by
   * chunk index and `resetCache()` runs between questions. A fetch begun for the old question -
   * the lookahead especially, which nothing awaits - otherwise lands after that reset and
   * re-populates index *n* of the *new* question with the previous one's audio.
   */
  private async getChunkBlob(index: number, total: number, seq: number): Promise<Blob | null> {
    const cached = this.cache.get(index);
    if (cached) return cached;

    const blob = await this.fetchOnce(index, seq);

    // Lookahead of one: kick off the next chunk's synthesis without waiting for it, so it is
    // likely ready by the time the current chunk finishes playing.
    if (index + 1 < total && !this.cache.has(index + 1)) {
      void this.fetchOnce(index + 1, seq);
    }

    return blob;
  }

  /**
   * Synthesize a chunk once, however many callers ask for it while it is in flight.
   *
   * A request only became visible to the next caller once it had resolved *into the cache*, so a
   * short chunk followed by a slow one had the loop ask for the chunk the lookahead was already
   * fetching - a second billed synthesis of the same sentence, and it cascaded, since that
   * duplicate then launched a lookahead of its own.
   */
  private fetchOnce(index: number, seq: number): Promise<Blob | null> {
    const inFlight = this.inFlight.get(index);
    if (inFlight) return inFlight;

    const request = this.fetchChunk(index)
      .then((blob) => {
        // The generation the fetch started under, because the cache is keyed by chunk index and
        // `resetCache()` runs between questions: a fetch begun for the old question otherwise
        // lands after that reset and fills index *n* of the *new* one with the previous audio.
        if (blob && seq === this.playSeq) this.cache.set(index, blob);
        return blob;
      })
      .finally(() => {
        if (this.inFlight.get(index) === request) this.inFlight.delete(index);
      });

    this.inFlight.set(index, request);
    return request;
  }

  private async fetchChunk(index: number): Promise<Blob | null> {
    const electron = getElectron();
    if (!electron) return null;
    try {
      const buffer = await electron.mockInterview.synthesizeChunk(index);
      return buffer ? new Blob([buffer], { type: 'audio/mpeg' }) : null;
    } catch (error) {
      console.warn(`[MockTtsService] failed to synthesize chunk ${index}:`, error);
      return null;
    }
  }

  /**
   * @param onStarted Fired once, when this element actually begins to sound.
   *
   * The transcript panel reveals the question in step with it, so *when* is the whole point.
   * `playQuestion` used to call it as soon as the first chunk's blob arrived, which is one
   * `createObjectURL`, one MP3 decode and one output-device start too early - enough that the
   * first words were already on screen before anything was audible, which is the gap between the
   * text and the speech. `playing` is the event that means sound, and it is used rather than
   * awaiting `play()`: that promise resolves once playback has been *permitted*, which on a
   * still-buffering element is earlier again.
   */
  private playBlob(blob: Blob, onStarted?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.audio = audio;

      let timer = 0;
      let settle: (() => void) | null = null;

      const cleanup = () => {
        window.clearTimeout(timer);
        // Every exit from this promise stops the element, not just the ones that pause it on the
        // way in. The timeout below is the case that matters: it abandons a stalled element and
        // drops the only reference to it, so one that later un-stalls would read the question out
        // over a reopened microphone and the next question's audio, reachable by nothing.
        try {
          audio.pause();
        } catch {
          // noop - the element is being discarded either way
        }
        URL.revokeObjectURL(url);
        // By identity, like `this.audio` below. A late `ended` or `error` from an element that
        // has already settled would otherwise clear the *current* playback's settler, and the
        // next `stop()` would then leave that playback parked forever - the gate's `finally`
        // never running, and the control bar's `busy` never released.
        if (this.settleStoppedPlayback === settle) this.settleStoppedPlayback = null;
        if (this.audio === audio) this.audio = null;
      };

      // The element firing neither `ended` nor `error` is the documented reason the gate carries
      // a watchdog - but that watchdog only reopens the microphone. Nothing covered the session:
      // this promise never settled, so `playQuestion` never sent `speechFinished`, main stayed in
      // `Speaking`, and `ingestAnswer` dropped every word the candidate said because the state
      // was wrong. `Speaking` is also the one state main arms no silence backstop in, so the
      // session simply stopped with the interviewer apparently mid-question. Rejecting here puts
      // it through the same path a decode failure takes: `speechFailed`, and on to `Listening`.
      timer = window.setTimeout(() => {
        cleanup();
        reject(new Error('Audio playback did not start or finish'));
      }, MOCK_TTS_CHUNK_TIMEOUT_MS);

      // How `stop()` settles a playback it interrupted - see the note there. Rejecting rather
      // than resolving keeps `playQuestion` out of its own success path, and it reports nothing:
      // `stop()` bumps `playSeq` first, so the `seq === this.playSeq` guard in that catch is
      // already false and no `speechFailed` is sent for a question deliberately abandoned.
      settle = () => {
        cleanup();
        reject(new DOMException('playback stopped', 'AbortError'));
      };
      this.settleStoppedPlayback = settle;

      // `playing` can fire again after a stall re-buffers, and the reveal must not restart with
      // it, so the handler detaches itself. `onStarted` is only passed for the first chunk of a
      // question anyway - the later ones are a continuation of a voice that has already begun.
      audio.onplaying = () => {
        audio.onplaying = null;
        onStarted?.();
      };

      audio.onended = () => {
        cleanup();
        resolve();
      };
      audio.onerror = () => {
        cleanup();
        reject(new Error('Audio playback error'));
      };
      audio.play().catch((error: unknown) => {
        cleanup();
        reject(error instanceof Error ? error : new Error('Audio play() rejected'));
      });
    });
  }
}

export const mockTtsService = new MockTtsService();
