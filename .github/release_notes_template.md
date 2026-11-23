<img width="1854" height="239" alt="release-note" src="https://github.com/user-attachments/assets/7960077d-58c0-47ab-acc7-d1086cbef231" />

## What's Changed

### Fixes
* When an interview cannot start, for example because no microphone is connected or the selected one is missing, the app now shows the reason and returns to the home screen instead of leaving you on an interview screen with no way to start

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
