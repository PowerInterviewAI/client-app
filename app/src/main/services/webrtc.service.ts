/**
 * WebRTC Service
 * Manages vcam and audio control agents for video processing
 */

import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import * as zmq from 'zeromq';

import { ApiClient } from '../api/client.js';
import {
  AUDIO_CONTROL_DELAY_MS,
  AUDIO_CONTROL_MAX_RESTART_COUNT,
  AUDIO_CONTROL_RESTART_DELAY_MS,
  VCAM_MAX_RESTART_COUNT,
  VCAM_RESTART_DELAY_MS,
  VCAM_ZMQ_PORT,
} from '../consts.js';
import { configStore } from '../store/config.store.js';
import { OfferRequest, WebRTCOptions } from '../types/webrtc.js';
import { EnvUtil } from '../utils/env.js';

interface AgentProcess {
  process: ChildProcess;
  name: 'vcam' | 'audio_control';
  restartCount: number;
  isRestarting: boolean;
  shouldRestart?: boolean;
}

class WebRTCService {
  private serviceActive = false;
  private vcamAgent: AgentProcess | null = null;
  private audioControlAgent: AgentProcess | null = null;
  private zmqPushSocket: zmq.Push | null = null;
  private frameCount = 0;

  /**
   * Offer WebRTC connection for media streaming
   */
  // eslint-disable-next-line
  async offer(offer: any): Promise<any> {
    const conf = configStore.getConfig();
    return await new ApiClient().post('/api/webrtc/offer', {
      sdp: offer.sdp,
      type: offer.type,
      options: {
        photo: conf.interviewConf.photo,
        enhance_face: conf.enableFaceEnhance,
      } as WebRTCOptions,
    } as OfferRequest);
  }

  // eslint-disable-next-line
  async getTurnCredentials(): Promise<any> {
    return await new ApiClient().get('/api/webrtc/turn-credentials');
  }

  /**
   * Start vcam and audio control agents
   */
  async startAgents(): Promise<void> {
    if (this.serviceActive) {
      console.log('WebRTC agents already active');
      return;
    }

    console.log('Starting WebRTC agents...');
    this.serviceActive = true;

    try {
      await Promise.all([
        this.startVCamAgent(),
        this.setupZmqPushSocket(),
        this.startAudioControlAgent(),
      ]);

      console.log('WebRTC agents started successfully');
    } catch (error) {
      console.error('Failed to start WebRTC agents:', error);
      // Cleanup on failure
      await this.stopAgents();
      throw error;
    }
  }

  /**
   * Stop all agents
   */
  async stopAgents(): Promise<void> {
    if (!this.serviceActive) {
      console.log('WebRTC agents not active');
      return;
    }

    console.log('Stopping WebRTC agents...');
    this.serviceActive = false;

    // Close ZMQ socket
    if (this.zmqPushSocket) {
      try {
        this.zmqPushSocket.close();
        this.zmqPushSocket = null;
      } catch (error) {
        console.error('Error closing ZMQ socket:', error);
      }
    }

    // Stop agents
    if (this.vcamAgent) {
      await this.stopAgent(this.vcamAgent);
      this.vcamAgent = null;
    }

    if (this.audioControlAgent) {
      await this.stopAgent(this.audioControlAgent);
      this.audioControlAgent = null;
    }

    this.frameCount = 0;
    console.log('WebRTC agents stopped');
  }

  /**
   * Send video frame to vcam agent via ZMQ
   */
  async putVideoFrame(frameData: ArrayBuffer): Promise<void> {
    if (!this.serviceActive || !this.zmqPushSocket) {
      console.warn('WebRTC agents not active. Cannot send video frame.');
      return;
    }

    try {
      const buffer = Buffer.from(frameData);
      await this.zmqPushSocket.send(buffer);
      this.frameCount++;

      // Log stats periodically
      if (this.frameCount % 300 === 0) {
        console.log(`Sent ${this.frameCount} frames to vcam agent`);
      }
    } catch (error) {
      console.error('Error sending video frame to vcam agent:', error);
    }
  }

  /**
   * Start vcam agent process
   */
  private async startVCamAgent(): Promise<void> {
    if (this.vcamAgent) {
      console.log('VCam agent already running');
      return;
    }

    const config = configStore.getConfig();
    const videoWidth = config.videoWidth || 1280;
    const videoHeight = config.videoHeight || 720;
    const fps = 30;

    const { command, args: baseArgs } = this.getVCamAgentCommand();

    console.log(`Starting VCam agent: ${command}`);
    console.log(`Video: ${videoWidth}x${videoHeight} @ ${fps}fps, Port: ${VCAM_ZMQ_PORT}`);

    const args = [
      ...baseArgs,
      '--width',
      videoWidth.toString(),
      '--height',
      videoHeight.toString(),
      '--fps',
      fps.toString(),
      '--port',
      VCAM_ZMQ_PORT.toString(),
      '--watch-parent',
    ];

    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false,
    });

    proc.stdout?.on('data', (data) => {
      console.log('[VCam Agent]', data.toString().trim());
    });

    proc.stderr?.on('data', (data) => {
      console.error('[VCam Agent]', data.toString().trim());
    });

    const agentProcess: AgentProcess = {
      process: proc,
      name: 'vcam',
      restartCount: 0,
      isRestarting: false,
      shouldRestart: true,
    };

    this.vcamAgent = agentProcess;

    proc.on('exit', (code, signal) => {
      console.log(`VCam agent exited: code=${code}, signal=${signal}`);
      this.handleAgentExit(agentProcess, async () => {
        await Promise.all([this.setupZmqPushSocket(), this.startVCamAgent()]);
      });
    });

    proc.on('error', (error) => {
      console.error('VCam agent process error:', error);
    });
  }

  /**
   * Start audio control agent process
   */
  private async startAudioControlAgent(): Promise<void> {
    if (this.audioControlAgent) {
      console.log('Audio control agent already running');
      return;
    }

    const config = configStore.getConfig();
    const inputDevice = config.audioInputDeviceName || 'loopback';
    const audioDelay = config.audioDelayMs || AUDIO_CONTROL_DELAY_MS;

    const { command, args: baseArgs } = this.getAudioControlAgentCommand();

    console.log(`Starting Audio Control agent: ${command}`);
    console.log(`Input device: ${inputDevice}, Delay: ${audioDelay}ms`);

    const args = [
      ...baseArgs,
      '--input',
      inputDevice,
      '--delay',
      audioDelay.toString(),
      '--watch-parent',
    ];

    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false,
    });

    proc.stdout?.on('data', (data) => {
      console.log('[Audio Control]', data.toString().trim());
    });

    proc.stderr?.on('data', (data) => {
      console.error('[Audio Control]', data.toString().trim());
    });

    const agentProcess: AgentProcess = {
      process: proc,
      name: 'audio_control',
      restartCount: 0,
      isRestarting: false,
      shouldRestart: true,
    };

    this.audioControlAgent = agentProcess;

    proc.on('exit', (code, signal) => {
      console.log(`Audio control agent exited: code=${code}, signal=${signal}`);
      this.handleAgentExit(agentProcess, () => this.startAudioControlAgent());
    });

    proc.on('error', (error) => {
      console.error('Audio control agent process error:', error);
    });
  }

  /**
   * Setup ZMQ push socket for sending frames to vcam agent
   */
  private async setupZmqPushSocket(): Promise<void> {
    try {
      const sock = new zmq.Push();
      await sock.bind(`tcp://127.0.0.1:${VCAM_ZMQ_PORT}`);
      this.zmqPushSocket = sock;
      console.log(`ZMQ push socket bound on port ${VCAM_ZMQ_PORT}`);
    } catch (error) {
      console.error('Failed to setup ZMQ push socket:', error);
      throw error;
    }
  }

  /**
   * Stop an agent process
   */
  private async stopAgent(agent: AgentProcess): Promise<void> {
    agent.shouldRestart = false;

    if (agent.process && !agent.process.killed) {
      try {
        agent.process.kill('SIGTERM');

        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (!agent.process.killed) {
              console.log(`Force killing ${agent.name} agent...`);
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
        console.error(`Error stopping ${agent.name} agent:`, error);
      }
    }
  }

  /**
   * Handle agent process exit and restart if needed
   */
  private async handleAgentExit(
    agent: AgentProcess,
    restartFn: () => Promise<void>
  ): Promise<void> {
    if (agent.shouldRestart === false) {
      console.log(`${agent.name} agent exit was intentional; not restarting`);
      return;
    }

    const maxRestart =
      agent.name === 'vcam' ? VCAM_MAX_RESTART_COUNT : AUDIO_CONTROL_MAX_RESTART_COUNT;
    const restartDelay =
      agent.name === 'vcam' ? VCAM_RESTART_DELAY_MS : AUDIO_CONTROL_RESTART_DELAY_MS;

    if (!agent.isRestarting && agent.restartCount < maxRestart) {
      console.log(
        `${agent.name} agent will restart (attempt ${agent.restartCount + 1}/${maxRestart})`
      );
      agent.isRestarting = true;
      agent.restartCount++;

      // Clean up old agent reference
      if (agent.name === 'vcam') {
        this.vcamAgent = null;
        // Close and recreate ZMQ socket
        if (this.zmqPushSocket) {
          try {
            this.zmqPushSocket.close();
            this.zmqPushSocket = null;
          } catch (error) {
            console.error('Error closing ZMQ socket during restart:', error);
          }
        }
      } else if (agent.name === 'audio_control') {
        this.audioControlAgent = null;
      }

      await new Promise((resolve) => setTimeout(resolve, restartDelay));

      try {
        await restartFn();
        agent.isRestarting = false;
        console.log(`${agent.name} agent restarted successfully`);
      } catch (error) {
        console.error(`Failed to restart ${agent.name} agent:`, error);
        agent.isRestarting = false;
      }
    } else {
      console.error(
        `${agent.name} agent failed to restart after ${maxRestart} attempts or is already restarting`
      );
      agent.isRestarting = false;
    }
  }

  /**
   * Get vcam agent executable command
   */
  private getVCamAgentCommand(): { command: string; args: string[] } {
    // In production, use built executable
    let buildDir = path.join(process.execPath, '..', 'agents');
    // In development, use local build
    if (EnvUtil.isDev()) {
      buildDir = path.join(process.cwd(), '..', 'build', 'agents', 'dist');
    }
    const exeName = process.platform === 'win32' ? 'vcam_agent.exe' : 'vcam_agent';
    return {
      command: path.join(buildDir, exeName),
      args: [],
    };
  }

  /**
   * Get audio control agent executable command
   */
  private getAudioControlAgentCommand(): { command: string; args: string[] } {
    // In production, use built executable
    let buildDir = path.join(process.execPath, '..', 'agents');
    // In development, use local build
    if (EnvUtil.isDev()) {
      buildDir = path.join(process.cwd(), '..', 'build', 'agents', 'dist');
    }
    const exeName =
      process.platform === 'win32' ? 'audio_control_agent.exe' : 'audio_control_agent';
    return {
      command: path.join(buildDir, exeName),
      args: [],
    };
  }

  /**
   * Get current service status
   */
  getStatus() {
    return {
      serviceActive: this.serviceActive,
      vcamAgentRunning: this.vcamAgent !== null && !this.vcamAgent.process.killed,
      audioControlAgentRunning:
        this.audioControlAgent !== null && !this.audioControlAgent.process.killed,
      frameCount: this.frameCount,
    };
  }
}

export const webRtcService = new WebRTCService();
