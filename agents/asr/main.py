"""
ASR Agent - Main Entry Point
Reads audio from a source and transcribes via backend websocket, then outputs to ZeroMQ.
"""

import argparse
import os
import signal
import sys
import threading
import time

import psutil
from loguru import logger

from agents.asr.asr_agent import ASRAgent

# Default configuration
DEFAULT_ZMQ_PORT = 50002
DEFAULT_AUDIO_SOURCE = "loopback"
DEFAULT_BACKEND_URL = "ws://localhost:8080/api/asr/streaming"


def monitor_parent_process(parent_pid: int, agent: ASRAgent) -> None:
    """Monitor parent process and exit if it dies."""
    logger.info(f"Monitoring parent process PID: {parent_pid}")
    while agent.running:
        try:
            if not psutil.pid_exists(parent_pid):
                raise ProcessLookupError  # noqa: TRY301
        except (OSError, ProcessLookupError):
            logger.warning(f"Parent process {parent_pid} no longer exists. Shutting down...")
            agent.running = False
            break
        time.sleep(1.0)


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="ASR Agent - Captures audio and transcribes via backend websocket")
    parser.add_argument(
        "-p",
        "--port",
        type=int,
        default=DEFAULT_ZMQ_PORT,
        help=f"ZeroMQ port (default: {DEFAULT_ZMQ_PORT})",
    )
    parser.add_argument(
        "-s",
        "--source",
        type=str,
        default=DEFAULT_AUDIO_SOURCE,
        help=f"Audio source: 'loopback' or device name (default: {DEFAULT_AUDIO_SOURCE})",
    )
    parser.add_argument(
        "-u",
        "--url",
        type=str,
        default=DEFAULT_BACKEND_URL,
        help=f"Backend websocket URL (default: {DEFAULT_BACKEND_URL})",
    )
    parser.add_argument(
        "-t",
        "--token",
        type=str,
        default=None,
        help="Authentication token for websocket (will be sent as cookie 'session_token=<token>')",
    )
    parser.add_argument(
        "--watch-parent",
        action="store_true",
        help="Monitor parent process and exit if it dies",
    )

    args = parser.parse_args()

    # Create agent
    agent = ASRAgent(
        zmq_port=args.port,
        audio_source=args.source,
        backend_url=args.url,
        session_token=args.token,
    )

    # Setup signal handlers for graceful shutdown
    def signal_handler(signum: int, _frame: object) -> None:
        logger.info(f"Received signal {signum}")
        agent.running = False

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Start parent process monitor if requested
    if args.watch_parent:
        parent_pid = os.getppid()
        monitor_thread = threading.Thread(
            target=monitor_parent_process,
            args=(parent_pid, agent),
            daemon=True,
            name="parent-monitor",
        )
        monitor_thread.start()

    return agent.run()


if __name__ == "__main__":
    sys.exit(main())
