"""
WebSocket client for ASR streaming.
"""

import asyncio
import contextlib
import json
from collections.abc import Callable

import numpy as np
import websockets
from loguru import logger
from websockets import ClientConnection

from agents.asr.audio_capture import AudioCapture

# WebSocket configuration constants
SILENCE_INTERVAL_SECONDS = 10.0
SILENCE_FRAME = b"\x00" * 320  # 20 ms @ 16kHz PCM16
RECONNECT_DELAY_SECONDS = 1.0
MAX_RECONNECT_ATTEMPTS = 0  # 0 = infinite


def _mix_to_stereo_pcm16(data_l: np.ndarray, data_r: np.ndarray) -> bytes:  # type: ignore  # noqa: PGH003
    """Mix two mono float32 arrays into interleaved stereo PCM16 bytes.

    Runs in a thread-pool executor to avoid blocking the asyncio event loop.
    """
    n = min(len(data_l), len(data_r))
    pcm16_l = (data_l[:n] * 32767).astype(np.int16)
    pcm16_r = (data_r[:n] * 32767).astype(np.int16)
    stereo = np.empty((pcm16_l.size + pcm16_r.size,), dtype=np.int16)
    stereo[0::2] = pcm16_l
    stereo[1::2] = pcm16_r
    return stereo.tobytes()


class WebSocketASRClient:
    """WebSocket client for streaming audio to ASR backend."""

    def __init__(
        self,
        backend_url: str,
        audio_capture_loopback: AudioCapture,
        audio_capture_mic: AudioCapture,
        on_partial: Callable[[str, str], None] | None = None,
        on_final: Callable[[str, str], None] | None = None,
        session_token: str | None = None,
    ) -> None:
        self.backend_url = backend_url
        self.audio_capture_loopback = audio_capture_loopback
        self.audio_capture_mic = audio_capture_mic
        self.on_partial = on_partial
        self.on_final = on_final
        self.session_token = session_token

        # Connection state
        self.ws: ClientConnection | None = None
        self.connected = False
        self.should_reconnect = True
        self.reconnect_attempts = 0
        self.stop_event = asyncio.Event()

        # Statistics
        self.transcripts_received = 0

    async def get_next_audio(self) -> bytes:
        """Get next audio chunk from both capture channels and mix to stereo."""
        while True:
            if self.stop_event.is_set():
                msg = "Stop requested"
                raise asyncio.CancelledError(msg)

            # If either queue is empty, wait briefly and check again to avoid busy-waiting
            if self.audio_capture_loopback.is_empty() or self.audio_capture_mic.is_empty():
                await asyncio.sleep(0)  # Sleep briefly to avoid busy-waiting
                continue

            # Fetch both channels concurrently
            data_loopback = self.audio_capture_loopback.get_frame_nowait()
            data_mic = self.audio_capture_mic.get_frame_nowait()

            # No audio available from mic channel - sleep 0 for other tasks and check again
            if data_mic is None:
                logger.warning("No audio from mic channel; waiting for data")
                await asyncio.sleep(0)
                continue

            # If loopback channel is empty, use silence for that channel
            if data_loopback is None:
                logger.warning("No audio from loopback channel; using silence")
                data_loopback = np.zeros_like(data_mic)

            return _mix_to_stereo_pcm16(data_loopback, data_mic)

    async def send_audio_loop(self, ws: ClientConnection) -> None:
        """Send audio frames to websocket."""

        logger.debug("Clearing audio queues before starting send loop")
        self.audio_capture_loopback.clear_queue()
        self.audio_capture_mic.clear_queue()

        logger.info("Audio send loop started")
        try:
            while True:
                if self.stop_event.is_set():
                    logger.debug("Stop event set; exiting send loop")
                    break

                try:
                    pcm_bytes = await asyncio.wait_for(
                        self.get_next_audio(),
                        timeout=SILENCE_INTERVAL_SECONDS,
                    )
                except TimeoutError:
                    try:
                        await ws.send(SILENCE_FRAME)
                        logger.debug("Sent silence frame")
                    except Exception as e:
                        logger.error(f"Failed to send silence: {e}")
                        raise
                    continue

                try:
                    # logger.debug(f"Sending audio frame: {len(pcm_bytes)} bytes, hash: {hash(pcm_bytes)}")  # noqa: E501, ERA001
                    await ws.send(pcm_bytes)
                except Exception as e:
                    logger.error(f"Failed to send audio: {e}")
                    raise

        except asyncio.CancelledError:
            logger.info("Send loop cancelled")
            raise
        except Exception as e:
            logger.exception(f"Send loop error: {e}")
            raise
        finally:
            logger.info("Audio send loop stopped")

    async def receive_transcript_loop(self, ws: ClientConnection) -> None:
        """Receive transcripts from websocket."""
        logger.info("Transcript receive loop started")
        try:
            async for msg in ws:
                if self.stop_event.is_set():
                    break

                # Skip binary messages
                if isinstance(msg, bytes):
                    continue

                # Parse JSON transcript
                try:
                    result = json.loads(msg)
                    logger.debug(f"Received transcript message: {result}")
                    result_type = result.get("type", "")
                    content = result.get("content", "")
                    channel_id = result.get("channel_id", "unknown")

                    self.transcripts_received += 1

                    if result_type == "final":
                        logger.info(f"{channel_id}::FINAL::{content}")
                        if self.on_final:
                            self.on_final(channel_id, content)
                    elif result_type == "partial":
                        logger.debug(f"{channel_id}::PARTIAL::{content}")
                        if self.on_partial:
                            self.on_partial(channel_id, content)
                    elif result_type == "error":
                        logger.error(f"ASR Error::{channel_id}::{content}")
                    else:
                        logger.debug(f"Unknown message type: {result}")

                except Exception as e:
                    logger.debug(f"Failed to parse transcript: {e}")

        except asyncio.CancelledError:
            logger.info("Receive loop cancelled")
            raise
        except Exception as e:
            logger.exception(f"Receive loop error: {e}")
            raise
        finally:
            logger.info("Transcript receive loop stopped")

    async def connect_and_stream(self) -> None:
        """Connect to backend websocket and stream audio."""
        logger.info(f"Connecting to backend websocket: {self.backend_url}")

        try:
            self.audio_capture_loopback.clear_queue()
            self.audio_capture_mic.clear_queue()

            # Prepare headers for authenticated connection if token provided
            additional_headers: dict[str, str] = {}
            if self.session_token:
                additional_headers["cookie"] = f"session_token={self.session_token}"

            async with websockets.connect(
                self.backend_url,
                ping_timeout=None,
                close_timeout=5,
                additional_headers=additional_headers,
            ) as ws:
                logger.info("Connected to backend websocket")
                self.ws = ws
                self.connected = True

                # Run send and receive loops concurrently
                await asyncio.gather(
                    self.send_audio_loop(ws),
                    self.receive_transcript_loop(ws),
                )

        except asyncio.CancelledError:
            logger.info("WebSocket task cancelled")
            raise
        except websockets.exceptions.ConnectionClosed as e:
            logger.warning(f"WebSocket connection closed: {e.code} - {e.reason}")
            # Connection closed, will be handled by reconnection logic
        except Exception as e:
            logger.exception(f"WebSocket error: {e}")
        finally:
            with contextlib.suppress(Exception):
                if self.ws:
                    await self.ws.close()
            self.ws = None
            self.connected = False
            logger.info("WebSocket connection closed")

    async def connect_with_retry(self) -> None:
        """Connect and stream with automatic reconnection on failures."""
        while self.should_reconnect and not self.stop_event.is_set():
            try:
                # Attempt connection
                await self.connect_and_stream()

                # If we get here, connection ended gracefully or with error
                if not self.should_reconnect or self.stop_event.is_set():
                    break

                # Check reconnection attempts limit (0 = infinite)
                if MAX_RECONNECT_ATTEMPTS > 0:
                    self.reconnect_attempts += 1
                    if self.reconnect_attempts >= MAX_RECONNECT_ATTEMPTS:
                        logger.error(f"Max reconnection attempts ({MAX_RECONNECT_ATTEMPTS}) reached")
                        break
                    logger.info(
                        f"Reconnecting in {RECONNECT_DELAY_SECONDS} seconds... "
                        f"(attempt {self.reconnect_attempts}/{MAX_RECONNECT_ATTEMPTS})"
                    )
                else:
                    # Infinite reconnection - don't track attempts
                    logger.info(f"Reconnecting in {RECONNECT_DELAY_SECONDS} seconds...")
                await asyncio.sleep(RECONNECT_DELAY_SECONDS)

            except asyncio.CancelledError:
                logger.info("Connection retry cancelled")
                break
            except Exception as e:
                logger.exception(f"Unexpected error in connection retry loop: {e}")
                if not self.should_reconnect or self.stop_event.is_set():
                    break
                await asyncio.sleep(RECONNECT_DELAY_SECONDS)

        logger.info("WebSocket client stopped")

    def stop(self) -> None:
        """Signal the client to stop and disable reconnection."""
        self.should_reconnect = False
        self.stop_event.set()
