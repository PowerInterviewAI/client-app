"""Build ASR Agent executable using Nuitka."""

import shutil
import sys

from scripts.cfg import config as cfg
from scripts.proc import run


def build_asr_agent() -> None:
    """Build ASR Agent with Nuitka."""
    asr_main = cfg.AGENTS_DIR / "asr" / "main.py"
    # Use separate build directory for ASR agent to avoid conflicts
    build_dir = cfg.AGENTS_BUILD_DIR / "asr.build"
    dist_dir = cfg.AGENTS_DIST_DIR  # Shared output directory for all agents
    output_name = "asr_agent.exe"

    if not asr_main.exists():
        print(f"❌ Error: {asr_main} not found.")  # noqa: T201
        sys.exit(1)

    print("==== Building ASR Agent ====")  # noqa: T201

    # Create output directory
    build_dir.mkdir(parents=True, exist_ok=True)

    nuitka_cmd = (
        f"python -m nuitka {asr_main} "
        "--standalone "
        "--include-package=agents.asr "
        "--include-package=websockets "
        "--follow-imports "
        f"--output-dir={build_dir} "
        f"--output-filename={output_name} "
        "--assume-yes-for-downloads "
        "--windows-console-mode=attach "
    )

    run(nuitka_cmd)

    # Nuitka creates main.dist inside build_dir
    built_dist = build_dir / "main.dist"
    built_exe = built_dist / output_name

    if built_exe.exists():
        # Merge contents from main.dist to shared dist_dir

        # Ensure dist_dir exists
        dist_dir.mkdir(parents=True, exist_ok=True)

        # Copy all files, merging with existing content (Python 3.8+)
        shutil.copytree(built_dist, dist_dir, dirs_exist_ok=True)

        final_exe = dist_dir / output_name
        print(f"✅ ASR Agent built: {final_exe}")  # noqa: T201
    else:
        print(f"❌ Build failed - executable not found: {built_exe}")  # noqa: T201
        sys.exit(1)


if __name__ == "__main__":
    build_asr_agent()
