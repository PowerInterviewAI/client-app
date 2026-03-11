/**
 * Transcription Service
 * Manages self and other party transcription using ASR agents
 */

import { ChildProcess, spawn } from 'child_process';
import { BrowserWindow } from 'electron';
import path from 'path';
import * as zmq from 'zeromq';

import {
  BACKEND_BASE_URL,
  LIVE_SUGGESTION_GAP_MS,
  TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS,
  TRANSCRIPT_MAX_RESTART_COUNT,
  TRANSCRIPT_RESTART_DELAY_MS,
  TRANSCRIPT_ZMQ_PORT,
} from '../consts.js';
import { configStore } from '../store/config.store.js';
import { Speaker, Transcript } from '../types/app-state.js';
import { EnvUtil } from '../utils/env.js';
import { appStateService } from './app-state.service.js';
import { liveSuggestionService } from './suggestion.live.service.js';

interface AgentProcess {
  process: ChildProcess;
  socket: zmq.Subscriber | null;
  port: number;
  restartCount: number;
  isRestarting: boolean;
  shouldRestart?: boolean;
}

class TranscriptService {
  private agent: AgentProcess | null = null;

  private selfTranscripts: Transcript[] = [];
  private selfPartialTranscript: Transcript | null = null;
  private otherTranscripts: Transcript[] = [];
  private otherPartialTranscript: Transcript | null = null;

  /**
   * Start transcription
   */
  private async startTranscription(): Promise<void> {
    if (this.agent) {
      console.log('Transcription already active');
      return;
    }

    console.log('Starting transcription...');

    // Get audio device from config
    const config = configStore.getConfig();
    const audioDevice = config.audioInputDeviceName || 'loopback';

    try {
      this.agent = await this.startAgent(TRANSCRIPT_ZMQ_PORT, audioDevice);
      console.log('Transcription started successfully');
    } catch (error) {
      console.error('Failed to start transcription:', error);
      this.agent = null;
      throw error;
    }
  }

  /**
   * Stop transcription
   */
  private async stopTranscription(): Promise<void> {
    if (!this.agent) {
      console.log('Transcription not active');
      return;
    }

    console.log('Stopping transcription...');
    await this.stopAgent(this.agent);
    this.agent = null;
    console.log('Transcription stopped');
  }

  /**
   * Start an ASR agent process
   */
  private async startAgent(port: number, audioSource: string): Promise<AgentProcess> {
    // Get agent executable path
    const { command, args: baseArgs } = this.getAgentCommand();
    const serverUrl = BACKEND_BASE_URL.replace(/\/+$/, ''); // Remove trailing slash
    const wsUrl = `${serverUrl.replace('http', 'ws')}/api/asr/streaming`;

    // Get session token
    const sessionToken = configStore.getConfig().sessionToken;

    console.log(`Starting ASR agent: ${command}`);
    console.log(`Audio source: ${audioSource}, Port: ${port}`);

    // Build arguments
    const args = [
      ...baseArgs,
      '--port',
      port.toString(),
      '--source',
      audioSource,
      '--url',
      wsUrl,
      '--watch-parent', // Enable parent process monitoring
    ];

    if (sessionToken) {
      args.push('--token', sessionToken);
    }

    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false,
    });

    // Log agent output
    proc.stdout?.on('data', (data) => {
      console.log(`[ASR]`, data.toString().trim());
    });

    proc.stderr?.on('data', (data) => {
      console.error(`[ASR]`, data.toString().trim());
    });

    const agentProcess: AgentProcess = {
      process: proc,
      socket: null,
      port,
      restartCount: 0,
      isRestarting: false,
      shouldRestart: true,
    };

    // Setup ZeroMQ subscriber
    await this.setupZmqSubscriber(agentProcess);

    // Handle process exit
    proc.on('exit', (code, signal) => {
      console.log(`ASR agent exited: code=${code}, signal=${signal}`);
      this.handleAgentExit(agentProcess);
    });

    proc.on('error', (error) => {
      console.error(`ASR agent process error:`, error);
    });

    return agentProcess;
  }

  /**
   * Setup ZeroMQ subscriber for an agent
   */
  private async setupZmqSubscriber(agent: AgentProcess): Promise<void> {
    try {
      const sock = new zmq.Subscriber();
      sock.connect(`tcp://localhost:${agent.port}`);
      sock.subscribe(''); // Subscribe to all messages

      agent.socket = sock;

      // Start receiving messages
      this.receiveMessages(agent);

      console.log(`ZeroMQ subscriber connected on port ${agent.port}`);
    } catch (error) {
      console.error('Failed to setup ZeroMQ subscriber:', error);
      throw error;
    }
  }

  /**
   * Receive messages from ZeroMQ socket
   */
  private async receiveMessages(agent: AgentProcess): Promise<void> {
    if (!agent.socket) return;

    try {
      for await (const [msg] of agent.socket) {
        const message = msg.toString();
        console.log(`[ZMQ] Received:`, message);

        // Parse message format: "ch_0::PARTIAL::So I'll fix it then, ..."
        // Be defensive: protect against malformed messages (missing parts).
        const [channelRaw = '', rawType = '', ...rest] = message.split('::');
        const isFinal = String(rawType).toLowerCase() === 'final';
        const text = rest.join('::').trim();
        const speaker = String(channelRaw).toLowerCase() === 'ch_0' ? Speaker.Other : Speaker.Self;

        if (text) {
          const transcript: Transcript = {
            timestamp: new Date().getTime(),
            text,
            isFinal,
            speaker,
            endTimestamp: new Date().getTime(),
          };

          if (transcript.speaker === Speaker.Self) {
            if (isFinal) {
              transcript.timestamp = this.selfPartialTranscript?.timestamp ?? transcript.timestamp;
              this.selfTranscripts.push(transcript);
              this.selfPartialTranscript = null;
            } else {
              if (this.selfPartialTranscript) {
                this.selfPartialTranscript.text = transcript.text;
                this.selfPartialTranscript.endTimestamp = transcript.endTimestamp;
              } else {
                this.selfPartialTranscript = transcript;
              }
            }
          } else {
            if (isFinal) {
              transcript.timestamp = this.otherPartialTranscript?.timestamp ?? transcript.timestamp;
              this.otherTranscripts.push(transcript);
              this.otherPartialTranscript = null;
            } else {
              if (this.otherPartialTranscript) {
                this.otherPartialTranscript.text = transcript.text;
                this.otherPartialTranscript.endTimestamp = transcript.endTimestamp;
              } else {
                this.otherPartialTranscript = transcript;
              }
            }
          }

          // Merge transcripts and update app state
          let allTranscripts = [...this.selfTranscripts, ...this.otherTranscripts];
          if (this.selfPartialTranscript) {
            allTranscripts.push(this.selfPartialTranscript);
          }
          if (this.otherPartialTranscript) {
            allTranscripts.push(this.otherPartialTranscript);
          }
          allTranscripts = allTranscripts.filter(Boolean).sort((a, b) => a.timestamp - b.timestamp);

          // Clean up consecutive transcripts from same speaker
          const cleaned: Transcript[] = [];
          for (const t of allTranscripts) {
            const lastIndex = cleaned.length - 1;

            // If same speaker and gap is small, merge into last transcript
            if (lastIndex < 0) {
              cleaned.push({ ...t });
              continue;
            }

            // Check if we can merge with last cleaned transcript
            const lastCleaned = cleaned[lastIndex];
            if (
              lastIndex >= 0 &&
              lastCleaned.speaker === t.speaker &&
              t.timestamp - lastCleaned.endTimestamp <= TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS
            ) {
              lastCleaned.text += ' ' + t.text;
              lastCleaned.endTimestamp = t.endTimestamp;
            } else {
              cleaned.push({ ...t });
            }
          }

          // Determine the last final SELF transcript (if any)
          const lastSelf = cleaned.filter((t) => t.speaker === Speaker.Self).slice(-1)[0];

          // Generate suggestions
          // - Do NOT generate while the user is currently speaking (self partial exists)
          // - Skip generating if the most recent SELF final is too recent (within gap)
          if (transcript.speaker === Speaker.Other && transcript.isFinal) {
            if (this.selfPartialTranscript) {
              console.log('Skipping suggestion: SELF partial active');
            } else {
              const skipDueToRecentSelf =
                !!lastSelf &&
                lastSelf.isFinal &&
                new Date().getTime() - lastSelf.endTimestamp <= LIVE_SUGGESTION_GAP_MS;
              if (!skipDueToRecentSelf) {
                await liveSuggestionService.startGenerateSuggestion(cleaned);
              } else {
                console.log('Skipping suggestion generation due to recent self transcript');
              }
            }
          }

          // Update application state
          appStateService.updateState({ transcripts: cleaned });
        }
      }
    } catch (error) {
      if (agent.socket) {
        console.error(`Error receiving ZMQ messages:`, error);
      }
    }
  }

  /**
   * Stop an agent process
   */
  private async stopAgent(agent: AgentProcess): Promise<void> {
    // Prevent automatic restart when stopping intentionally
    agent.shouldRestart = false;

    // Close ZeroMQ socket
    if (agent.socket) {
      try {
        agent.socket.close();
        agent.socket = null;
      } catch (error) {
        console.error('Error closing ZeroMQ socket:', error);
      }
    }

    // Kill the process
    if (agent.process && !agent.process.killed) {
      try {
        agent.process.kill('SIGTERM');

        // Wait for graceful shutdown, then force kill if needed
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (!agent.process.killed) {
              console.log('Force killing agent process...');
              agent.process.kill('SIGKILL');
            }
            resolve();
          }, 5000);

          agent.process.once('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      } catch (error) {
        console.error('Error stopping agent process:', error);
      }
    }
  }

  /**
   * Handle agent process exit
   */
  private async handleAgentExit(agent: AgentProcess): Promise<void> {
    // Close socket
    if (agent.socket) {
      try {
        agent.socket.close();
        agent.socket = null;
      } catch (error) {
        console.error('Error closing socket on exit:', error);
      }
    }

    // Check if we should restart (skip if stopped intentionally)
    if (agent.shouldRestart === false) {
      console.log(`Agent exit was intentional; not restarting`);
      return;
    }

    // Check restart conditions
    if (!agent.isRestarting && agent.restartCount < TRANSCRIPT_MAX_RESTART_COUNT) {
      console.log(
        `Agent will restart (attempt ${agent.restartCount + 1}/${TRANSCRIPT_MAX_RESTART_COUNT})`
      );
      agent.isRestarting = true;
      agent.restartCount++;

      // Wait before restarting
      await new Promise((resolve) => setTimeout(resolve, TRANSCRIPT_RESTART_DELAY_MS));

      try {
        // Determine audio source based on speaker
        const config = configStore.getConfig();
        const audioSource = config.audioInputDeviceName || 'loopback';

        // Start new agent
        const newAgent = await this.startAgent(agent.port, audioSource);
        newAgent.restartCount = agent.restartCount;

        // Update reference
        this.agent = newAgent;

        console.log(`Agent  restarted successfully`);
      } catch (error) {
        console.error(`Failed to restart agent:`, error);
        agent.isRestarting = false;
      }
    } else if (agent.restartCount >= TRANSCRIPT_MAX_RESTART_COUNT) {
      console.error(`Agent exceeded max restart attempts`);
      // Notify renderer about failure
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].webContents.send('transcription-error', {
          error: 'Agent crashed and exceeded max restart attempts',
        });
      }
    }
  }

  /**
   * Get the command and args to run the ASR agent
   */
  private getAgentCommand(): { command: string; args: string[] } {
    // In production, use built executable
    let buildDir = path.join(process.execPath, '..', 'agents');
    // In development, use local build
    if (EnvUtil.isDev()) {
      buildDir = path.join(process.cwd(), '..', 'build', 'agents', 'dist');
    }
    const exeName = process.platform === 'win32' ? 'asr_agent.exe' : 'asr_agent';
    return {
      command: path.join(buildDir, exeName),
      args: [],
    };
  }

  /**
   * Start all transcription services
   */
  async start(): Promise<void> {
    await this.startTranscription();
  }

  /**
   * Stop all transcription services
   */
  async stop(): Promise<void> {
    await this.stopTranscription();
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
