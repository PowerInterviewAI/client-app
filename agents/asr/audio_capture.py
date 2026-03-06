"""
Audio capture service for ASR agent.
"""

import contextlib
import queue
from typing import Any

import numpy as np
import pyaudiowpatch as pyaudio
from loguru import logger
from scipy.signal import resample_poly

from agents.shared.audio_device_service import AudioDeviceService

# Audio configuration constants
TARGET_SAMPLE_RATE = 16000
AUDIO_BLOCK_DURATION = 0.2
AUDIO_QUEUE_MAXSIZE = 2


class AudioCapture:
    """Captures audio from a device and provides resampled frames via queue."""

    def __init__(self, audio_source: str = "loopback") -> None:
        self.audio_source = audio_source
        self.audio_queue: queue.Queue[np.ndarray[Any, Any]] = queue.Queue(maxsize=AUDIO_QUEUE_MAXSIZE)

        # Audio device info
        self.sample_rate: int = 48000
        self.channels: int = 2
        self.blocksize: int = 0
        self.device_index: int | None = None

        # PyAudio objects
        self.pa: pyaudio.PyAudio | None = None
        self.stream: pyaudio.Stream | None = None

        # Statistics
        self.frames_captured = 0

    def _audio_callback(
        self,
        in_data: bytes,
        _frame_count: int,
        _time_info: dict[str, Any],
        _status_flags: int,
    ) -> tuple[Any, Any]:
        """PyAudio callback for audio capture."""
        try:
            # Convert to float32 in [-1,1]
            data_np = np.frombuffer(in_data, dtype=np.int16).astype(np.float32) / 32768.0

            # Convert to mono
            if self.channels > 1:
                data_np = (
                    data_np.reshape(-1, self.channels).mean(axis=1)
                    if data_np.size % self.channels == 0
                    else data_np[:: self.channels]
                )

            # Resample to 16kHz if needed
            if self.sample_rate != TARGET_SAMPLE_RATE:
                data_np = resample_poly(data_np, TARGET_SAMPLE_RATE, self.sample_rate)

            # Enqueue (drop oldest if full)
            if self.audio_queue.full():
                with contextlib.suppress(Exception):
                    self.audio_queue.get_nowait()

            self.audio_queue.put_nowait(data_np)
            self.frames_captured += 1

        except Exception as e:
            logger.debug(f"Audio callback error: {e}")

        return (None, pyaudio.paContinue)

    def start(self) -> bool:
        """Initialize and start audio capture."""
        try:
            if self.pa is None:
                self.pa = pyaudio.PyAudio()

            # Determine device index
            if self.audio_source.lower() == "loopback":
                # Get default WASAPI loopback device
                try:
                    loopback_dev = self.pa.get_default_wasapi_loopback()
                    self.device_index = int(loopback_dev.get("index", 0))
                    self.sample_rate = int(loopback_dev.get("defaultSampleRate", 48000))
                    self.channels = int(loopback_dev.get("maxInputChannels", 2))
                    logger.info(f"Using loopback device: index={self.device_index}")
                except Exception as e:
                    logger.error(f"Failed to get loopback device: {e}")
                    return False
            else:
                # Search for device by name using AudioDeviceService
                self.device_index = AudioDeviceService.get_device_index_by_name(self.audio_source)
                if self.device_index is None or self.device_index < 0:
                    logger.error(f"Audio device '{self.audio_source}' not found")
                    return False

                # Get device info
                dev_info = self.pa.get_device_info_by_index(self.device_index)
                self.sample_rate = int(dev_info["defaultSampleRate"])
                self.channels = int(dev_info["maxInputChannels"])
                logger.info(f"Found device '{dev_info['name']}': index={self.device_index}")

            self.blocksize = int(self.sample_rate * AUDIO_BLOCK_DURATION)

            # Open audio stream
            logger.info(
                f"Starting audio: device={self.device_index}, rate={self.sample_rate}Hz, channels={self.channels}"
            )

            self.stream = self.pa.open(
                format=pyaudio.paInt16,
                channels=self.channels,
                rate=self.sample_rate,
                input=True,
                input_device_index=self.device_index,
                frames_per_buffer=self.blocksize,
                stream_callback=self._audio_callback,
            )

            self.stream.start_stream()
            logger.info("Audio capture started")
            return True  # noqa: TRY300

        except Exception as e:
            logger.exception(f"Failed to initialize audio capture: {e}")
            return False

    def stop(self) -> None:
        """Stop audio capture and clean up resources."""
        if self.stream:
            try:
                if self.stream.is_active():
                    self.stream.stop_stream()
            except Exception as e:
                logger.debug(f"Error stopping audio stream: {e}")

            try:
                self.stream.close()
            except Exception as e:
                logger.debug(f"Error closing audio stream: {e}")

            self.stream = None

        if self.pa:
            try:
                self.pa.terminate()
            except Exception as e:
                logger.debug(f"Error terminating PyAudio: {e}")
            self.pa = None

    def get_frame_nowait(self) -> np.ndarray[Any, Any] | None:
        """Get next audio frame from queue without blocking."""
        try:
            return self.audio_queue.get_nowait()
        except queue.Empty:
            return None

    def clear_queue(self) -> None:
        """Clear all audio frames from the queue."""
        try:
            while not self.audio_queue.empty():
                with contextlib.suppress(Exception):
                    self.audio_queue.get_nowait()
        except Exception as e:
            logger.debug(f"Error clearing audio queue: {e}")
