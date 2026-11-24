<img width="1854" height="239" alt="release-note" src="https://github.com/user-attachments/assets/7960077d-58c0-47ab-acc7-d1086cbef231" />

## What's Changed

<!-- Filled in on the published release after the workflow creates it. Never commit real
     release content here: whatever is in this file is published verbatim with the next tag. -->
_Release notes for VERSION_PLACEHOLDER are being written._

---

## Having trouble to install?
Just use the command lines
- Windows
```
curl -L -o PowerInterviewAI-Setup-VERSION_PLACEHOLDER.exe https://github.com/PowerInterviewAI/client-app/releases/latest/download/PowerInterviewAI-Setup-VERSION_PLACEHOLDER.exe && start "" "PowerInterviewAI-Setup-VERSION_PLACEHOLDER.exe"
```
- MacOS (works on both Apple Silicon and Intel - picks the build matching `uname -m`)
```
SUF="-x64"; [ "$(uname -m)" = "arm64" ] && SUF="-arm64"; DMG="Power.Interview.AI-VERSION_PLACEHOLDER$SUF.dmg"; curl -L -o "$DMG" "https://github.com/PowerInterviewAI/client-app/releases/latest/download/$DMG" && open "$DMG"
```
