"""
ASR Agent - Main agent orchestration.
"""

import asyncio
import threading
import time

from loguru import logger

from agents.asr.audio_capture import AudioCapture
from agents.asr.websocket_client import WebSocketASRClient
from agents.asr.zmq_publisher import ZMQPublisher

# Configuration constants
STATS_INTERVAL_SECONDS = 10.0


class ASRAgent:
    """
    ASR Agent that orchestrates audio capture, ASR transcription,
    and ZeroMQ publishing.
    """

    def __init__(
        self,
        zmq_port: int,
        audio_source: str,
        backend_url: str,
        session_token: str | None = None,
    ) -> None:
        self.zmq_port = zmq_port
        self.audio_source = audio_source
        self.backend_url = backend_url
        self.session_token = session_token

        # Components
        self.audio_capture_loopback = AudioCapture()
        self.audio_capture_mic = AudioCapture(audio_source=audio_source)

        self.ws_client_loopback: WebSocketASRClient | None = None
        self.ws_client_mic: WebSocketASRClient | None = None
        self.zmq_publisher = ZMQPublisher(port=zmq_port)

        # Control
        self.running = False

        # Threads
        self.ws_thread: threading.Thread | None = None

    def _on_partial_loopback(self, text: str) -> None:
        """Callback for loopback partial transcripts."""
        self.zmq_publisher.publish("ch_0", text, is_final=False)

    def _on_final_loopback(self, text: str) -> None:
        """Callback for loopback final transcripts."""
        self.zmq_publisher.publish("ch_0", text, is_final=True)

    def _on_partial_mic(self, text: str) -> None:
        """Callback for mic partial transcripts."""
        self.zmq_publisher.publish("ch_1", text, is_final=False)

    def _on_final_mic(self, text: str) -> None:
        """Callback for mic final transcripts."""
        self.zmq_publisher.publish("ch_1", text, is_final=True)

    async def start_connections_async(self) -> None:
        if self.ws_client_loopback is None or self.ws_client_mic is None:
            logger.error("WebSocket clients not initialized")
            return

        await asyncio.gather(
            self.ws_client_mic.connect_with_retry(),
            self.ws_client_loopback.connect_with_retry(),
        )

    def _websocket_thread_func(self) -> None:
        """WebSocket thread function with reconnection logic."""
        # Create WebSocket client once
        self.ws_client_loopback = WebSocketASRClient(
            backend_url=self.backend_url,
            audio_capture=self.audio_capture_loopback,
            on_partial=self._on_partial_loopback,
            on_final=self._on_final_loopback,
            session_token=self.session_token,
        )
        self.ws_client_mic = WebSocketASRClient(
            backend_url=self.backend_url,
            audio_capture=self.audio_capture_mic,
            on_partial=self._on_partial_mic,
            on_final=self._on_final_mic,
            session_token=self.session_token,
        )

        # Run with automatic reconnection

        try:
            asyncio.run(self.start_connections_async())
        except Exception as e:
            logger.error(f"WebSocket thread error: {e}")

        logger.info("WebSocket thread stopped")

    def start(self) -> bool:
        """Start the ASR agent."""
        logger.info("Starting ASR Agent...")

        # Initialize audio capture
        if not self.audio_capture_loopback.start():
            logger.error("Failed to initialize loopback audio capture")
            return False

        if not self.audio_capture_mic.start():
            logger.error("Failed to initialize audio capture")
            self.audio_capture_loopback.stop()
            return False

        # Initialize ZeroMQ
        if not self.zmq_publisher.connect():
            logger.error("Failed to initialize ZeroMQ")
            self.audio_capture_loopback.stop()
            self.audio_capture_mic.stop()
            return False

        # Start WebSocket thread
        self.running = True

        self.ws_thread = threading.Thread(
            target=self._websocket_thread_func,
            daemon=True,
            name="asr-websocket",
        )
        self.ws_thread.start()

        logger.info("ASR Agent started successfully")
        return True

    def stop(self) -> None:
        """Stop the ASR agent."""
        logger.info("Stopping ASR Agent...")

        self.running = False

        # Signal WebSocket client to stop (will disable reconnection)
        if self.ws_client_mic:
            self.ws_client_mic.stop()
        if self.ws_client_loopback:
            self.ws_client_loopback.stop()

        # Wait for WebSocket thread to finish
        if self.ws_thread and self.ws_thread.is_alive():
            logger.info("Waiting for WebSocket thread to finish...")
            self.ws_thread.join(timeout=10.0)
            if self.ws_thread.is_alive():
                logger.warning("WebSocket thread did not stop in time")

        # Clean up resources
        self.audio_capture_loopback.stop()
        self.audio_capture_mic.stop()
        self.zmq_publisher.disconnect()

        logger.info("ASR Agent stopped")

    def print_stats(self) -> None:
        """Print statistics."""
        ws_transcripts = self.ws_client_mic.transcripts_received if self.ws_client_mic else 0
        logger.info(
            f"Stats - Audio: {self.audio_capture_mic.frames_captured} frames | "
            f"Transcripts: {ws_transcripts} received, {self.zmq_publisher.published_count} published | "
            f"ZMQ failures: {self.zmq_publisher.failed_count}"
        )

    def run(self) -> int:
        """Main run loop."""
        if not self.start():
            logger.error("Failed to start ASR Agent")
            return 1

        try:
            # Main loop - wait and print stats periodically
            last_stats_time = time.time()

            while self.running:
                time.sleep(1.0)

                # Print stats periodically
                if time.time() - last_stats_time >= STATS_INTERVAL_SECONDS:
                    self.print_stats()
                    last_stats_time = time.time()

        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received")
        finally:
            self.stop()

        logger.info("ASR Agent exited")
        return 0
