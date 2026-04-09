import ctypes
from typing import Any

import sounddevice as sd
from loguru import logger


class AudioDeviceService:
    """
    Service for managing audio device enumeration and information using Windows API.

    Uses Windows Multimedia API (MME) directly for device enumeration, avoiding
    PortAudio limitations and stream interruptions.
    """

    VB_AUDIO_INPUT_DEVICE_NAME = "CABLE Input (VB-Audio Virtual"

    # Windows API constants and structures
    WAVE_MAPPER = -1

    class WAVEINCAPS(ctypes.Structure):
        _fields_ = [  # noqa: RUF012
            ("wMid", ctypes.c_ushort),
            ("wPid", ctypes.c_ushort),
            ("vDriverVersion", ctypes.c_uint),
            ("szPname", ctypes.c_char * 32),
            ("dwFormats", ctypes.c_uint),
            ("wChannels", ctypes.c_ushort),
            ("wReserved1", ctypes.c_ushort),
        ]

    class WAVEOUTCAPS(ctypes.Structure):
        _fields_ = [  # noqa: RUF012
            ("wMid", ctypes.c_ushort),
            ("wPid", ctypes.c_ushort),
            ("vDriverVersion", ctypes.c_uint),
            ("szPname", ctypes.c_char * 32),
            ("dwFormats", ctypes.c_uint),
            ("wChannels", ctypes.c_ushort),
            ("wReserved1", ctypes.c_ushort),
            ("dwSupport", ctypes.c_uint),
        ]

    # Load Windows API functions
    try:
        winmm = ctypes.windll.winmm

        # Input device functions
        waveInGetNumDevs = winmm.waveInGetNumDevs  # noqa: N815
        waveInGetNumDevs.restype = ctypes.c_uint

        waveInGetDevCaps = winmm.waveInGetDevCapsA  # noqa: N815
        waveInGetDevCaps.argtypes = [ctypes.c_uint, ctypes.POINTER(WAVEINCAPS), ctypes.c_uint]

        # Output device functions
        waveOutGetNumDevs = winmm.waveOutGetNumDevs  # noqa: N815
        waveOutGetNumDevs.restype = ctypes.c_uint

        waveOutGetDevCaps = winmm.waveOutGetDevCapsA  # noqa: N815
        waveOutGetDevCaps.argtypes = [ctypes.c_uint, ctypes.POINTER(WAVEOUTCAPS), ctypes.c_uint]

    except AttributeError:
        logger.warning("Windows Multimedia API not available")
        winmm = None

    @classmethod
    def _query_input_devices(cls) -> list[dict[str, Any]]:
        """Query input devices using Windows Multimedia API."""
        if cls.winmm is None:
            logger.warning("Windows API not available, falling back to sounddevice")
            return cls._fallback_query_devices(input_only=True)

        devices = []
        try:
            num_devices = cls.waveInGetNumDevs()
            for i in range(num_devices):
                caps = cls.WAVEINCAPS()
                result = cls.waveInGetDevCaps(i, ctypes.byref(caps), ctypes.sizeof(caps))
                if result == 0:  # MMSYSERR_NOERROR
                    device_name = caps.szPname.decode("ascii", errors="ignore").rstrip("\x00")
                    # Find corresponding sounddevice index
                    sd_index = cls._find_sounddevice_index(device_name, is_input=True)
                    devices.append(
                        {
                            "index": sd_index if sd_index >= 0 else i,  # Use SD index if found, otherwise MME index
                            "name": device_name,
                            "max_input_channels": caps.wChannels,
                            "max_output_channels": 0,
                            "default_samplerate": 44100,  # Default for MME
                            "hostapi": 0,  # MME host API index
                        }
                    )
        except Exception as e:
            logger.warning(f"Failed to query input devices via Windows API: {e}")
            return cls._fallback_query_devices(input_only=True)

        return devices

    @classmethod
    def _query_output_devices(cls) -> list[dict[str, Any]]:
        """Query output devices using Windows Multimedia API."""
        if cls.winmm is None:
            logger.warning("Windows API not available, falling back to sounddevice")
            return cls._fallback_query_devices(output_only=True)

        devices = []
        try:
            num_devices = cls.waveOutGetNumDevs()
            for i in range(num_devices):
                caps = cls.WAVEOUTCAPS()
                result = cls.waveOutGetDevCaps(i, ctypes.byref(caps), ctypes.sizeof(caps))
                if result == 0:  # MMSYSERR_NOERROR
                    device_name = caps.szPname.decode("ascii", errors="ignore").rstrip("\x00")
                    # Find corresponding sounddevice index
                    sd_index = cls._find_sounddevice_index(device_name, is_input=False)
                    devices.append(
                        {
                            "index": sd_index if sd_index >= 0 else i,  # Use SD index if found, otherwise MME index
                            "name": device_name,
                            "max_input_channels": 0,
                            "max_output_channels": caps.wChannels,
                            "default_samplerate": 44100,  # Default for MME
                            "hostapi": 0,  # MME host API index
                        }
                    )
        except Exception as e:
            logger.warning(f"Failed to query output devices via Windows API: {e}")
            return cls._fallback_query_devices(output_only=True)

        return devices

    @classmethod
    def _find_sounddevice_index(cls, device_name: str, is_input: bool) -> int:  # noqa: FBT001
        """Find the sounddevice global index for a device name."""
        try:
            devices = sd.query_devices()
            for device in devices:
                if device["name"] == device_name:  # noqa: SIM102
                    # Check if it matches the channel type we're looking for
                    if (is_input and device["max_input_channels"] > 0) or (
                        not is_input and device["max_output_channels"] > 0
                    ):
                        return int(device["index"])
            return -1  # Not found  # noqa: TRY300
        except Exception:
            return -1

    @classmethod
    def _fallback_query_devices(cls, input_only: bool = False, output_only: bool = False) -> list[dict[str, Any]]:  # noqa: FBT001, FBT002
        """Fallback to sounddevice when Windows API is not available."""
        try:
            devices = sd.query_devices()
            result = []
            for device in devices:
                if input_only and device["max_input_channels"] == 0:
                    continue
                if output_only and device["max_output_channels"] == 0:
                    continue
                result.append(dict(device))
            return result  # noqa: TRY300
        except Exception as e:
            logger.error(f"Fallback device query failed: {e}")
            return []

    @classmethod
    def get_audio_devices(cls) -> list[dict[str, Any]]:
        """Get all MME audio devices (input and output) using Windows API."""
        input_devices = cls._query_input_devices()
        output_devices = cls._query_output_devices()

        # Combine and deduplicate devices (some may support both input and output)
        all_devices = {}
        for device in input_devices + output_devices:
            index = device["index"]
            if index not in all_devices:
                all_devices[index] = device.copy()
            else:
                # Merge channels if device supports both
                existing = all_devices[index]
                existing["max_input_channels"] = max(existing["max_input_channels"], device["max_input_channels"])
                existing["max_output_channels"] = max(existing["max_output_channels"], device["max_output_channels"])

        return list(all_devices.values())

    @classmethod
    def get_input_devices(cls) -> list[dict[str, Any]]:
        """Get MME input devices using Windows API."""
        return cls._query_input_devices()

    @classmethod
    def get_output_devices(cls) -> list[dict[str, Any]]:
        """Get MME output devices using Windows API."""
        return cls._query_output_devices()

    @classmethod
    def get_device_info_by_index(cls, index: int) -> dict[str, Any]:
        """Get device info by index using sounddevice (for compatibility)."""
        try:
            device = sd.query_devices(index)
            device_dict = dict(device)
            # Check if it's an MME device
            try:
                hostapis = sd.query_hostapis()
                hostapi_name = hostapis[device["hostapi"]]["name"]
                if "MME" not in hostapi_name:
                    logger.warning(f"Device {index} is not an MME device")
            except (IndexError, KeyError):
                logger.warning(f"Could not verify MME status for device {index}")
            return device_dict  # noqa: TRY300
        except Exception as e:
            logger.error(f"Failed to get device info for index {index}: {e}")
            return {}

    @classmethod
    def get_device_index_by_name(cls, name: str) -> int:
        """Get MME device index by name using Windows API."""
        try:
            audio_devices = cls.get_audio_devices()
            for device in audio_devices:
                if name.startswith(device["name"]):
                    return int(device["index"])
        except Exception as ex:
            logger.error(f"Failed to get device index by name: {name} {ex}")
        return -1

    @classmethod
    def get_vb_input_device(cls) -> dict[str, Any]:
        """Get the VB-Audio Virtual Cable Input device info."""
        try:
            audio_devices = cls.get_output_devices()
            for device in audio_devices:
                if device["name"].startswith(cls.VB_AUDIO_INPUT_DEVICE_NAME):
                    return device
        except Exception as ex:
            logger.error(f"Failed to get VB-Audio Virtual Cable Input device: {ex}")
        return {}

    @classmethod
    def get_vb_input_device_index(cls) -> int:
        """Get the index of the VB-Audio Virtual Cable Input device."""
        vb_input_device = cls.get_vb_input_device()
        return vb_input_device.get("index", -1)  # type: ignore  # noqa: PGH003
