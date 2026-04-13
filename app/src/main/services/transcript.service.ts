/**
 * Transcription Service
 * Maintains transcript state and suggestion triggers.
 */

import { LIVE_SUGGESTION_GAP_MS, TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS } from '../consts.js';
import { Speaker, Transcript } from '../types/app-state.js';
import { appStateService } from './app-state.service.js';
import { liveSuggestionService } from './suggestion.live.service.js';

class TranscriptService {
  private isActive = false;

  private selfTranscripts: Transcript[] = [];
  private selfPartialTranscript: Transcript | null = null;
  private otherTranscripts: Transcript[] = [];
  private otherPartialTranscript: Transcript | null = null;

  async ingest(channelRaw: string, typeRaw: string, textRaw: string): Promise<void> {
    if (!this.isActive) return;

    const text = String(textRaw ?? '').trim();
    if (!text) return;

    const speaker = String(channelRaw).toLowerCase() === 'ch_0' ? Speaker.Other : Speaker.Self;
    const isFinal = String(typeRaw).toLowerCase() === 'final';
    const now = Date.now();

    const transcript: Transcript = {
      timestamp: now,
      text,
      isFinal,
      speaker,
      endTimestamp: now,
    };

    if (transcript.speaker === Speaker.Self) {
      if (isFinal) {
        transcript.timestamp = this.selfPartialTranscript?.timestamp ?? transcript.timestamp;
        this.selfTranscripts.push(transcript);
        this.selfPartialTranscript = null;
      } else if (this.selfPartialTranscript) {
        this.selfPartialTranscript.text = transcript.text;
        this.selfPartialTranscript.endTimestamp = transcript.endTimestamp;
      } else {
        this.selfPartialTranscript = transcript;
      }
    } else if (isFinal) {
      transcript.timestamp = this.otherPartialTranscript?.timestamp ?? transcript.timestamp;
      this.otherTranscripts.push(transcript);
      this.otherPartialTranscript = null;
    } else if (this.otherPartialTranscript) {
      this.otherPartialTranscript.text = transcript.text;
      this.otherPartialTranscript.endTimestamp = transcript.endTimestamp;
    } else {
      this.otherPartialTranscript = transcript;
    }

    let allTranscripts = [...this.selfTranscripts, ...this.otherTranscripts];
    if (this.selfPartialTranscript) allTranscripts.push(this.selfPartialTranscript);
    if (this.otherPartialTranscript) allTranscripts.push(this.otherPartialTranscript);
    allTranscripts = allTranscripts.filter(Boolean).sort((a, b) => a.timestamp - b.timestamp);

    const cleaned: Transcript[] = [];
    for (const t of allTranscripts) {
      const lastIndex = cleaned.length - 1;
      if (lastIndex < 0) {
        cleaned.push({ ...t });
        continue;
      }

      const lastCleaned = cleaned[lastIndex];
      if (
        lastCleaned.speaker === t.speaker &&
        t.timestamp - lastCleaned.endTimestamp <= TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS
      ) {
        lastCleaned.text += ' ' + t.text;
        lastCleaned.endTimestamp = t.endTimestamp;
      } else {
        cleaned.push({ ...t });
      }
    }

    const lastSelf = cleaned.filter((t) => t.speaker === Speaker.Self).slice(-1)[0];
    if (transcript.speaker === Speaker.Other && transcript.isFinal) {
      if (this.selfPartialTranscript) {
        console.log('Skipping suggestion: SELF partial active');
      } else {
        const skipDueToRecentSelf =
          !!lastSelf &&
          lastSelf.isFinal &&
          Date.now() - lastSelf.endTimestamp <= LIVE_SUGGESTION_GAP_MS;
        if (!skipDueToRecentSelf) {
          await liveSuggestionService.startGenerateSuggestion(cleaned);
        } else {
          console.log('Skipping suggestion generation due to recent self transcript');
        }
      }
    }

    appStateService.updateState({ transcripts: cleaned });
  }

  /**
   * Start all transcription services
   */
  async start(): Promise<void> {
    this.isActive = true;
  }

  /**
   * Stop all transcription services
   */
  async stop(): Promise<void> {
    this.isActive = false;
  }

  /**
   * Clear all stored transcripts and partial transcripts
   */
  clear(): void {
    this.selfTranscripts = [];
    this.selfPartialTranscript = null;
    this.otherTranscripts = [];
    this.otherPartialTranscript = null;
    appStateService.updateState({ transcripts: [] });
  }
}

export const transcriptService = new TranscriptService();
