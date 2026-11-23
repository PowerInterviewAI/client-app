<img width="1854" height="239" alt="release-note" src="https://github.com/user-attachments/assets/7960077d-58c0-47ab-acc7-d1086cbef231" />

## What's Changed

### 97 interview languages
* Interviews now run in 97 languages, up from 28 - every language the speech model transcribes, including Cantonese and Traditional Chinese (Taiwan) as languages of their own
* One setting still covers the whole session: transcription, suggestions and the exported report all follow it, and it can be changed mid-interview
* Right-to-left languages such as Persian, Urdu, Pashto and Kurdish (Sorani) display right-to-left in the transcript and suggestions
* Exported reports use translated headings in most of the new languages

### Mock interviews speak 44 languages
* The mock interviewer now asks its questions out loud in 44 languages, up from 7, with a new, more natural voice
* In the other languages it writes its questions on screen instead; answering and scoring work the same way

### Find your language faster
* The language button on the control bar and the language setting (configuration, first-run setup and mock interview setup) now have a search box. Type an English name, the language's own name, or its code

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
