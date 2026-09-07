# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Lookups

Always use Context7 MCP (`mcp__context7__resolve-library-id` then `mcp__context7__query-docs`) before answering any question about a library, framework, SDK, or API. This includes Electron, React, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query, Vite, electron-builder, and electron-updater. Never answer from training data alone.

## Writing Rules

- Never generate em-dashes (--). Use a hyphen (-) or rewrite the sentence instead.
- No filler phrases, no trailing summaries, no explanations of what the code does.
- Comments only when the WHY is non-obvious.

## Commands

```bash
pnpm dev                       # Vite renderer dev server only (http://localhost:15173)
pnpm electron:dev-hide         # Electron + renderer dev, hidden window
pnpm electron:dev-show         # Electron + renderer dev, visible window
pnpm start                     # Alias for electron:dev-hide

pnpm build                     # tsc + vite build (renderer only)
pnpm electron:build-main       # Build Electron main process to electron-dist/
pnpm electron:build            # Full distribution build via electron-builder

pnpm lint                      # ESLint check
pnpm format                    # Prettier + ESLint auto-fix

pnpm test:main                 # Main-process checks (builds first; needs Node >= 22.15)
```

`.github/workflows/ci.yml` runs eslint, both `tsc` configs, the renderer build, and `pnpm test:main` on every pull request to `main`. Run the same locally first; CI is a backstop, not the first check. Releases are separate: `.github/workflows/release.yml` is `workflow_dispatch` only, so merging never publishes a build.

Prettier is not enforced anywhere, and a number of files do not currently satisfy it, so `pnpm format` produces unrelated churn. Format the files you touch, not the tree.

## Architecture

This is an Electron 40 desktop app. `src/main/` is the Node.js main process; `src/renderer/` is the React/Vite renderer. The renderer **never** calls backend APIs - all network calls go through IPC to main.

Path alias: `@/*` resolves to `./src/renderer/*`.

### IPC Bridge

[src/main/preload.cts](src/main/preload.cts) is compiled to CJS (required by Electron) and exposes `window.electronAPI` (aliased as `window.electron`) via `contextBridge`. Renderer types are declared in [src/renderer/types/electron-api.d.ts](src/renderer/types/electron-api.d.ts).

IPC channel naming convention: `domain:action` (e.g., `config:get`, `auth:login`, `live-suggestion:stop`).

Handler registration lives in [src/main/ipc/](src/main/ipc/) - one file per domain. Each `register*Handlers()` is called in `app.whenReady()` inside [src/main/index.ts](src/main/index.ts). Business logic lives in [src/main/services/](src/main/services/) and is exported as singletons (`export const fooService = new FooService()`).

### State: AppState vs ConfigStore

**AppState** ([src/renderer/hooks/use-app-state.tsx](src/renderer/hooks/use-app-state.tsx)) is read-only in the renderer. An `AppStateManager` singleton (pinned to `globalThis` to survive HMR) subscribes to `app-state-updated` push events from main; it falls back to 1-second polling when that API is unavailable. Never mutate AppState from the renderer - call the appropriate IPC method on main instead.

`AppState` and what the renderer receives are not the same object. `appStateService.getRendererState()` reduces `interviewConfig` to a `{ fullName, hasProfileData }` summary, because the whole state is broadcast on every change and the profile and context can each run to 128,000 characters. Never put the full CV back into the broadcast - `test/app-state.test.mjs` pins this. The configuration dialog fetches the real values on demand over `account:get`.

**ConfigStore** ([src/renderer/hooks/use-config-store.ts](src/renderer/hooks/use-config-store.ts)) is a Zustand store backed by the main-process Electron Store ([src/main/store/config.store.ts](src/main/store/config.store.ts)). Mutations call `window.electronAPI.config.update(...)` via IPC. A runtime migration IIFE at the bottom of the main store backfills newly-added keys on first launch.

**Interview config** (full name, profile/CV, context) is *not* in ConfigStore - the backend account is its durable store, managed by [src/main/services/account.service.ts](src/main/services/account.service.ts) and pulled on login or a remembered session. A pre-sync `runtime.interviewConf` may still exist on disk from older builds; it is migrated onto the account and only deleted once the backend confirms the write, so do not drop it eagerly (`test/config-store.test.mjs` pins this).

### Transcription and Suggestion Flow

[src/main/services/transcript.service.ts](src/main/services/transcript.service.ts) is the central orchestrator. `transcriptService.ingest(channel, type, text)` merges both audio channels, deduplicates overlapping segments, and decides whether a final `Other` transcript is worth answering - with a `LIVE_SUGGESTION_GAP_MS` guard that suppresses the call if Self spoke recently.

- `ch_0` = `Speaker.Other` (interviewer, captured via loopback audio)
- `ch_1` = `Speaker.Self` (candidate, captured via microphone)

**Not every interviewer turn needs an answer**, and deciding that is a cascade, cheapest stage first. `classifyInterviewerTurn()` ([src/main/utils/interviewer-turn.ts](src/main/utils/interviewer-turn.ts)) runs in-process on the *merged* turn and returns one of three verdicts: `Skip` drops the turn outright with no request and no card, `Answer` generates immediately, and `Uncertain` parks on an `INTERVIEWER_TURN_SETTLE_MS` timer that any further `ch_0` final re-arms. The `NO_SUGGESTION_NEEDED` sentinel is the *last* stage of the same cascade, not the only one.

Three things this ordering buys, all of which the sentinel alone could not. A turn caught at `Skip` costs no upload of the profile and context, no model call, and never reaches the panel, so nothing flashes on screen and is retracted. A question the ASR split across two finals - an ASR final is an acoustic endpoint, not the end of a thought - is classified whole instead of firing a request on the fragment that the continuation immediately aborts. And a completed question skips the settle wait entirely, so the latency is paid only by turns that are genuinely ambiguous.

The classifier is deliberately asymmetric, and `test/interviewer-turn.test.mjs` pins both halves. A filler that slips through costs one request and a card that flashes; a question misread as filler produces *nothing at all*, mid-interview, with no error anywhere. So `Skip` is returned only when the backchannel lexicon consumes the whole turn from the front, and everything it cannot fully consume falls through rather than being guessed at.

**The lexicon is English, and that used to leak into a test it had no business deciding.** `normalize()` reduces a turn to ASCII, which is correct for matching English backchannel and useless as a test for whether anything was said - a Japanese, Chinese, Thai, Russian, Korean, Arabic, Hindi, Greek or Hebrew turn reduces to nothing at all. Empty then hit the "entirely non-speech" branch meant for `[laugh]` and `(inaudible)`, so **every interviewer question in a non-Latin script was dropped outright**: no request, no card, no error, in roughly a third of the languages the picker offers. The two cases are now told apart by whether any letter in any script survived the non-speech markers (`\p{L}`); if one did, the verdict is `Uncertain`, which defers to the backend gate - the one stage that can actually read the language.

**A turn is not required to be in one script, and that is the same bug one branch further in.** "OK、では次の質問です。" does not normalize to nothing - it normalizes to exactly `ok`, because the loanword the interviewer opened on is Latin and Deepgram transcribes it that way. The lexicon eats it, the core comes back empty, and the question is dropped by the `core.length === 0` branch without the empty-normalized branch ever running. An interviewer opening on "OK" or "Yes" is ordinary in Japanese, Korean, Chinese, Russian, Greek, Arabic, Hebrew, Thai and Hindi alike. So `Skip` there additionally requires that no letter from a script the lexicon cannot read survived. The test is on **script**, not on the codepoint being non-ASCII: an accented Latin letter belongs to a word the lexicon does read, so blanking the umlaut in "Ähm" and matching `hm` stays a correct consumption rather than becoming a gate call on every filler in seventeen Latin-script languages. Non-ASCII question marks (`？`, `؟`) are folded to `?` in `normalize`, so a finished question in those scripts still answers immediately instead of waiting out the settle timer. Greek's `;` is deliberately left alone: it is an ordinary semicolon everywhere else, and reading it as terminal would answer English fragments.

`Answer` and `Uncertain` both reach the backend, as `turn_verdict` on `GenerateLiveSuggestionRequest` ([types/llm.ts](src/main/types/llm.ts) mirrors the wire values `answer` / `uncertain`; `Skip` never becomes a request and has no wire value). `Answer` tells the backend to trust the client and skip its own classifier; `Uncertain` asks it to run one. The backend's decision is speculative - it runs *beside* the generation it might cancel, not in front of it - and the client cooperates by holding the card back: `generateSuggestion()` in [suggestion-live.service.ts](src/main/services/suggestion-live.service.ts) does not append a `Pending` card on request start. It arms a `LIVE_SUGGESTION_RENDER_DELAY_MS` timer instead, so a turn the backend suppresses within that window produces no card at all rather than one that flashes and is retracted - the exact failure this whole cascade exists to remove. Any real write (loading state once headers arrive, a streamed chunk, an error) cancels the timer and renders immediately through `publish()`; a `Stopped` state from being superseded before ever rendering goes through `refresh()` instead, which is a no-op unless a card already exists, so a card the candidate never saw pending does not appear only to say it was cancelled.

Action suggestions are independent of transcripts - triggered by screenshot captures (up to `ACTION_SUGGESTION_MAX_CAPTURES` = 4 images per request).

**Hint-only mode** (`hintOnlyMode` in ConfigStore, on by default) asks the backend for hints - a headline plus keyword bullets - instead of the full sentences of full-sentence mode. Both suggestion services read the flag once at the top of `generateSuggestion` and send it as `mode` on the request; the backend defaults it to `normal`, so the field is safe to omit against an older deployment.

The setting was called `professionalMode` until it was renamed for the two modes it actually switches between. Two things survive that rename deliberately. `SuggestionMode`'s wire values are still `normal` / `professional`, because they are the backend's contract (`app/schemas/suggestion.py`) and it deploys separately - the TypeScript members are `FullSentence` / `HintOnly`, the strings are not. And the config store's migration reads the old key once to seed the new one before `scrubRetiredKey` removes it, so an upgrading install keeps the mode it was on rather than being moved onto the new default.

The `NO_SUGGESTION_NEEDED` sentinel goes through `isNoSuggestionSentinel()` ([src/main/utils/suggestion-sentinel.ts](src/main/utils/suggestion-sentinel.ts)) rather than a direct comparison. It backs up the deterministic gate above for turns the lexicon cannot settle, and it is in-band by nature - a control decision travelling in the answer stream - which is why it is the fallback rather than the mechanism. It is prefix-matched because it runs on every streamed chunk, and it strips leading markdown first: the hint-only prompt asks for a bold headline on line 1, so a model that carries that format over emits `**NO_SUGGESTION_NEEDED**` and a bare match would leave the sentinel on screen as a card. Unicode format characters are stripped with the emphasis, and that is what makes the fallback hold in Arabic and Hebrew: a model writing right-to-left routinely opens on a directional mark, and U+200F is not whitespace, so it survives `\s` and leaves the comparison starting on a character the sentinel does not - putting `NO_SUGGESTION_NEEDED` on screen as the answer to a question the backend had just decided needed none. `test/suggestion-sentinel.test.mjs` pins both halves - the wrapped forms are suppressed, real answers are not, including a real Hebrew one opening on the same mark.

Both live modes render through `SafeMarkdown`, the same component the action panel uses. The full-sentence prompt asks for plain text *with light formatting*, so any bold or bullet the model reached for used to land on screen as literal asterisks. Prose is passed through `withHardBreaks()` ([src/renderer/lib/suggestions.ts](src/renderer/lib/suggestions.ts)) first: Markdown folds a single newline into a space, and the `whitespace-pre-wrap` rendering it replaced showed every newline the model emitted.

The backend prompts now ask for inline emphasis on the words an answer turns on, in both modes, so `strong` and `em` are declared explicitly in `SafeMarkdown` rather than left to browser defaults - body copy is deliberately regular weight so that `strong` reads as emphasis against it. Live answers additionally go through `stripDanglingEmphasis()`: the panel re-renders on every streamed chunk, so each emphasized span exists for a few frames as an opening `**` with no closing pair, which Markdown renders as literal asterisks on the card the candidate is reading. It drops that one unmatched marker, leaving the text plain until the span closes. Live only - action suggestions carry code, where an asterisk is a dereference or a glob (`test/suggestion-emphasis.test.mjs` pins both halves, including that a `*` opening a list item is a block marker and never stripped).

Each `LiveSuggestion` still carries the `mode` it was *generated* under, and the panel keys off that rather than the current setting, so toggling mid-interview leaves cards already on screen alone. What the mode selects is the presentation around the Markdown: hint-only promotes the headline line, full-sentence keeps the 🪄 marker in a column of its own - prepending it to the content instead would swallow whatever structure the answer opens with.

### Assistant lifecycle

`RunningState` is what every control on the bar is gated on, and `Starting` and `Stopping` disable
all of them - Stop included. So the one invariant `useAssistantService` has to hold is that the
state always lands back on a terminal value, whatever went wrong on the way. `stopAssistant`
returns to `Idle` in a `finally`, and tears the four services down through `Promise.allSettled`
rather than `Promise.all`: `all` rejects on the first one that throws and abandons the other three,
so a single failing teardown used to leave the rest running *and* strand the app in `Stopping`
with no reachable control - unrecoverable without restarting the app, mid-interview. A partial
failure is now a toast rather than a throw, because there is nothing left for a caller to do about
it and the session is over either way.

The failed-start path is the mirror of that, and it belongs in exactly one place. `startAssistant`
already tears both services down and returns to `Idle` in its own `catch`, so `doStart` in
[control-panel/index.tsx](src/renderer/components/custom/control-panel/index.tsx) reports the error
and stops there. Calling `stopAssistant()` after it, as it used to, walked the button through a
three-second `Stopping` for a session that never started, and that call's own failure landed
outside the `try` as an unhandled rejection.

`useMediaDevices` reports `ready` alongside the device list because an empty list means two
different things - `enumerateDevices()` has not answered yet, and this machine has none - and the
control panel renders a destructive badge and refuses the start on the second. Reading them as one
put a red `!` on a working microphone for the first frames after every launch, and refused a start
requested quickly with a message naming a device that was there all along. An unset
`audioInputDeviceName` is a third state again, and also not "missing": `AudioGroup` is choosing
the default at that moment, in an effect - never in the render body, where the store write
re-enters React mid-commit and a failed IPC call rolls the value back into the same condition that
triggered it, one write per frame.

### Saving the interview before it is lost

The transcript and the suggestions live only in main-process memory. Nothing is written to disk
until an export, so the actions that empty them - Clear, Start (which opens with `clearAll()`),
Stop, and closing the app - are the only paths in the app that destroy work with no way back. All
of them ask first, through one dialog:
[save-history-dialog.tsx](src/renderer/components/custom/save-history-dialog.tsx), mounted once in
`MainFrame` because they do not share a screen - the control panel is not rendered in stealth
mode, the close prompt arrives from main with no component of its own, and the stop prompt
outlives the screen that raised it.

**Stop is the one that is not a guard.** The other reasons are asked *before* the destructive act
and can be answered with "not now", which leaves the interview alone. `useEndLiveSession`
([use-end-live-session.ts](src/renderer/hooks/use-end-live-session.ts)) stops the assistant, asks,
then clears and goes home whatever the answer was - so the dialog drops its Cancel and refuses Esc
for that reason, because an Esc that read as backing out would silently be the discard. It is
deliberately not what the stop *hotkey* does: that one fires while the app is hidden mid-screen-
share, where a modal dialog and a navigation to the dashboard are the opposite of what was asked
for, and the next Start still asks about the transcript it left behind.

**The question is only worth asking about a real interview, and length cannot tell you that.**
`setPlaceholderState()` seeds the panels with one transcript and two suggestions so an empty app
has something to show, and it runs on launch and again after every Clear - so
`transcripts.length === 0` is never true and the old guard let the placeholder through. That was
already a live defect on the export path: Export on a machine that had never run an interview
passed the length check and billed a summarize call on "Transcripts will be here", then wrote the
model's answer into a document titled as a record of the candidate's interview.

`AppState.hasHistory` is the replacement, derived in `withHistory()` and never set by a caller -
`updateState` strips it off incoming updates, because it arrives inside a `Partial<AppState>` the
renderer composes and the close guard trusts it. Only the transcript and suggestion services
write the three history keys and they only ever write real content, so a write to any of them
retires the placeholder and the flag is recomputed from what the write leaves behind. The
untouched arrays are emptied in the same write: `clearAll()` runs before every session so mixed
state is not reachable today, but a real transcript sitting beside two lines of sample suggestion
copy is the one shape that would put placeholder text into an exported report.

**The flag is read from the transcripts and live suggestions only, not from all three.** Those are
what `exportTranscript` builds the report out of; action suggestions have never been in it. So a
session whose only content is a screenshot has nothing a save could capture, and counting it would
both offer to save what the save cannot contain and let the export guard through on an empty
transcript - the billed summarize call over nothing that the guard exists to stop, reached through
a different door. The export guard and `nothingToExport` both read the flag now, and
`test/save-history.test.mjs` pins it.

**Closing is the one that cannot ask on its own behalf.** Clear and Start are renderer-initiated
and confirm before they act; a close is decided in main - the window button, Cmd+Q, `app.quit()` -
and the renderer would hear about it too late to matter. So
[window-close-guard.ts](src/main/window-close-guard.ts) vetoes the close, sends
`app:save-history-prompt`, and the renderer closes the window itself by replying. Exactly one of
`window:close-confirmed` / `window:close-cancelled` has to come back or the app cannot be closed
at all, which is why the guard gives up on a renderer that is destroyed or crashed rather than
holding the window open with nobody to ask.

Three pieces of state, each for a failure the others do not cover. `closeConfirmed` lets the
answered close through instead of re-prompting on it. `prompting` stops a second close - the
window button pressed while the dialog is up - stacking another prompt. And `quitting`, set from
`before-quit`, is what makes Cmd+Q work: vetoing the close *cancels the quit*, so confirming has
to call `app.quit()` again rather than `win.close()`, or the app would sit there with one window
fewer. Cancelling resets it, or the next Cmd+Q would take that branch for a session the user just
chose to keep.

A save that the user cancels at the system save dialog leaves the prompt open rather than reading
as a decision to discard, and so does a failed export - going ahead there would destroy the
interview on the one path where keeping it did not work.

**Installing an update is a quit the guard must not veto.** `quitAndInstall()` launches the
installer - on macOS `shell.openPath` has already opened the .dmg - and requests the quit
*afterwards*, so a veto there does not cancel the update. It leaves an installer running against
an app that refuses to exit, which on Windows ends with the installer killing it: the interview is
lost anyway, and the prompt asking about it was on screen for a second. So the updater IPC handler
calls `allowNextClose()` before it installs, and `rearmCloseGuard()` if nothing was launched
(`quitAndInstall` returns whether it committed to quitting, which the macOS "no downloaded file"
path does not).

**A failed install reports nothing - it simply does not quit** - so `rearmCloseGuardIfStillRunning()`
puts the guard back unless `before-quit` has fired by then. Without it one failed update disarms
the guard for the rest of the session and the next close takes the interview with it, which is
precisely what the guard exists to stop. The test is `quitting` rather than a window count,
because re-arming a quit that *is* under way turns the guard into a veto of the close it just
approved.

The question is asked one layer up, in `update-notification.tsx`, in front of the install rather
than behind it. It reads `hasHistory` over `appState.get()` on the click instead of through
`useSaveHistoryGuard`: that hook subscribes to the app state, which during an interview is a new
object several times a second, and this component would then re-render and re-arm its status
effect on every ASR partial to answer a question it only asks when a button is pressed.

### Interview language

One setting decides three things: which speech model transcribes the call, what language suggestions come back in, and the language of the exported report. `Language` is mirrored across the processes the way `SuggestionMode` is - [src/main/types/language.ts](src/main/types/language.ts) for the request bodies, [src/renderer/types/language.ts](src/renderer/types/language.ts) for the same enum plus the display metadata the picker needs. 28 languages, which is exactly what the backend's Deepgram Nova-3 ASR streams: offering one the ASR cannot hear would not degrade, it would answer a question that was never asked.

A code this build knows but an older backend does not is resolved back to English there rather than faked, so a client ahead of its backend degrades one session instead of breaking it. `test/language.test.mjs` pins the two mirrors staying in step, which is the failure the widening made likely: an enum member with no picker entry renders a blank trigger, and a picker entry with no enum member resolves straight back to English when picked. The menu is capped and scrolls, because it opens upward from the bottom-most control into an overflow-hidden `main` - an uncapped 28-item list runs off the top of the window rather than flipping.

**English is the absence of the feature.** `buildStreamingUrl` sends no `language` parameter at all for English rather than `language=en`, and the backend defaults the request field, so a session that never touches the picker produces exactly the traffic it produced before this existed.

`configStore.getConfig()` resolves the language on the way *out*, not on the way in. The disk holds whatever some build wrote - a code a later release dropped, or one an older release never knew - and every consumer reads through `getConfig`, so that is the single place an unknown code can be stopped before it reaches the ASR URL and three request bodies. `test/language.test.mjs` pins it.

**The picker stays live mid-interview**, because an interview that switches language is the case it exists for and not one the candidate can prepare for by restarting. The two halves of the setting move at different speeds and `useInterviewLanguage` is where that is reconciled. Suggestions need nothing: every request reads the config store as it is built, so the next one already follows. The ASR carries its language as a *connection* parameter, so `liveTranscriptionService.setLanguage()` tears both sockets down and re-opens them - a second or two of gap, and whatever utterance was mid-flight is orphaned, which is why the button shows a spinner rather than pretending the change was instant and why the menu says so before the user commits.

Three guards in `AudioWsStream` make that safe, and all three protect against the same failure - two sockets on one channel, one of them orphaned and still relaying audio into a dead session. `ws.onclose` ignores a close from a socket that is no longer `this.ws`, since that is the tail of a replacement rather than a disconnect; and the `switching` flag suppresses the ordinary backoff reconnect for the close `setLanguage` causes itself, which it then handles immediately instead of after `WS_RETRY_BASE_DELAY_MS`. `connectWebSocket` rebuilds the URL per attempt rather than capturing it, which is what lets a reconnect pick up the new language at all.

The third is `switchSeq`, the generation token the microphone path already had, and it exists because the other two are per-socket while the failure is per-channel. Two switches overlap - the picker disables its trigger on `switching`, but the hook only sets that *after* awaiting the config write, so a second pick lands in the gap - and both run a `connectWithRetry` loop that assigns `this.ws` synchronously per attempt. The older loop wakes from its backoff after the newer one has opened its socket and overwrites the field with its own; the newer socket is then unreferenced, so `stop()` never closes it and the Deepgram session behind it stays open for the life of the app, billing and transcribing a language nobody selected. The loop captures the generation at entry and stops before building another socket, `connectWebSocket` re-checks on open (the window is a whole `WS_OPEN_TIMEOUT_MS`), the reconnect timer carries its own since `setLanguage` can only cancel a timer that has not fired yet, and a superseded switch leaves the backoff and the toast to whichever switch replaced it. `test/language-switch.test.mjs` pins it, source-level, for the same reason the device tests are.

`useInterviewLanguage` needs the same guard one layer up, and so does `useAudioInputDevice`. A superseded switch is *abandoned* by the service, which resolves it in the hook as a success - so without a generation ref there, a switch the user has already moved off clears the warning raised by the one that replaced it and drops the spinner while that one is still reconnecting.

Two consequences of that first guard. `setLanguage` has to report `channelDisconnected` itself rather than leaving it to `onclose`: `new WebSocket` assigns `this.ws` synchronously, so the old socket's close event always arrives after the replacement exists and is correctly ignored. And `setLanguage` keys its own no-op check on `this.ws` rather than on `active`, which `start()` only sets *after* its first connect returns - in that window a socket exists on the old language and an `active` check would skip it.

The setting is persisted *before* the reconnect and never rolled back on failure: a failed reconnect that reverted the setting would leave the user with no route to the language they picked, whereas leaving it set means stopping and starting the assistant recovers.

**That choice leaves the two halves disagreeing, and the UI has to say so for longer than a toast does.** Suggestions have moved and transcription has not, so the menu shows the new language with a check beside it while the transcript is still arriving in the old one - and a candidate reading answers in one language and a transcript in another has no other way to tell which half moved. `reconnectFailed` keeps it visible: the trigger icon goes destructive, the tooltip says "Suggestions only", and the menu replaces its reconnect notice with what actually happened. It is cleared on a switch that succeeds and on leaving `Running`, because the next start opens both sockets on the stored language and the disagreement is gone with the session that produced it.

The trigger shows the code (`EN`, `ES`) next to the icon for the same reason the tooltip names the language - the one question this control has to answer at a glance is what it is currently set to.

Menu items carry an explicit `textValue` of the **English** name. Radix runs its own typeahead on an open menu and matches a prefix of that; left unset it uses the item's rendered text, which is the two names run together (`PolskiPolish`), so only the endonym was ever reachable by typing. At six entries that hardly mattered. At 28 the endonym column is what the eye scans and the English name is what a user types, and they should be two access paths rather than one.

**Whether two transcript blocks are joined with a space is a property of the words, not of the setting.** `Transcript` therefore carries the language it was transcribed in, stamped at ingest, and `mergeAdjacentTranscripts` reads it per block. `cleaned` is rebuilt from every stored transcript on each ingest, so a single reading of the current setting did not apply to new text - it applied to the whole session, retroactively: switching an English interview to Japanese an hour in stripped the spaces out of every block merged so far, on screen and in the transcript the next request carries. `test/transcript-merge.test.mjs` pins both directions.

**Arabic and Hebrew need a text direction, and the panels are laid out left-to-right.** Every block `SafeMarkdown` emits carries `dir="auto"`, as do the transcript lines and both panels' question lines. The defect without it is not that RTL text renders left-to-right - it does not - it is that the neutrals go the wrong way: sentence-final punctuation takes the *paragraph's* direction, so the question mark lands at the wrong end, and a technical answer reorders at every switch of script, which is every answer since the prompts keep product names and code in Latin. Per block rather than once on a wrapper, because `auto` resolves from the first strong character it contains. Block code is pinned to `dir="ltr"` instead: code is left-to-right in every language and one RTL comment in a fence flips the whole block. `test/rtl-rendering.test.mjs` pins it, and it is a no-op in every language that shipped before the picker.

The app's own chrome is **not** localised, deliberately: an English button on a Spanish interview is an inconvenience, an English transcript of Spanish speech is a wrong answer read out loud.

**The exported report is the one exception**, because it is the one artifact that leaves the machine and is handed to someone who was not there. The summarize prompt translates the headings *it* writes; the five words the client wraps around them - Transcripts, Suggestions, Suggestion, Interviewer, Date/Time - live in [export-labels.ts](src/main/utils/export-labels.ts) and follow the same setting, or the export is the half-translated document that prompt exists to avoid. The candidate is named rather than labelled, and timestamps stay on the machine's locale. `test/tools-export.test.mjs` pins that every enum member has a full set and that an unknown code falls back to English rather than throwing.

### Headphones

`ch_0` is a loopback of the system's render endpoint, which is the same sound the speakers are
playing. So on speakers the microphone hears the interviewer a fraction of a second after the
loopback does, and the same words arrive on **both** channels. The transcript duplicates, which is
visible; the damaging half is not. The echo lands as a recent `Self` final, so
`skipDueToRecentSelf` in [transcript.service.ts](src/main/services/transcript.service.ts)
suppresses the live suggestion **for the question that was just asked**, with no error anywhere.
See #111 for the measurements and the longer-term suppression work.

[headphone-notice-dialog.tsx](src/renderer/components/custom/headphone-notice-dialog.tsx) is shown
before every session until the user silences it, and it says what actually goes wrong rather than
recommending headphones for "best results" - the cost of ignoring it is answers that never appear.

**Nothing here detects the output route, and the dialog does not pretend to.**
`enumerateDevices()` reports what exists, not what the sound is coming out of, and a label match on
"headset" would be wrong in both directions: it would clear a user whose headphones are plugged in
but not selected, and nag one whose USB interface is named after a mixer. The user's answer is the
only signal available, so it is asked for.

It is the first thing Start asks, ahead of the save prompt and the macOS permission gate, because
on speakers the echo is already in the audio before the first question and because it is the
cheapest of the three to back out of - cancelling here means the other two were never asked.
`startAfterNotice` holds everything after it so the dialog can hand the start back without
duplicating those checks.

Shown before every session, deliberately with no "don't show again": whether the call is on
speakers is a property of the machine and the meeting, not a setting, and it can change between
any two sessions on the same install - a permanent silence option would contradict the one fact
this dialog exists to establish. A `variant` prop (`'live' | 'mock'`) swaps the copy rather than
the mechanism: the live session's failure mode is a suppressed suggestion (the mic hears its own
question), while a mock session has no suggestion to suppress, only the transcribed answer's own
echo tail - so the mock variant names that instead of borrowing the live copy.

### Audio input device

**The microphone can be changed mid-interview**, and for the same reason the language can: the case
it exists for only shows up once the session is running. A headset that dies, is unplugged, or was
the wrong device to begin with is noticed when the interviewer says they cannot hear you, and the
control used to be locked at exactly that moment - the only fix was stopping the assistant, which
drops the transcript and the suggestion history with it.

It is cheaper than the language switch, and the difference is worth keeping straight. The device is
only what feeds the worklet; it is **not** a connection parameter. So `AudioWsStream.setStream()`
replaces the `MediaStreamAudioSourceNode` while the socket, the provider session and any utterance
in flight all survive. Nothing reconnects, there is no gap in the transcript, and the dialog
therefore promises the opposite of what the language menu warns about. Reaching for `setLanguage`'s
machinery here would reintroduce the gap this avoids.

Two things `liveTranscriptionService.setAudioInputDevice()` has to hold, both pinned by
`test/audio-device-switch.test.mjs`. **The replacement stream is acquired before anything is torn
down**, and the previous one stopped only after the swap succeeds, so a device that is unplugged,
held by another app, or refused by permissions leaves the interview on the microphone it already
had. Releasing first reads as the obvious cleanup order and works every time the new device is
present; on the one path that matters it leaves the session with no microphone at all, mid-answer.
And a stream that finishes opening *after* the session stopped is released rather than left holding
the device with its indicator light on, since nothing else keeps a reference to it.

`setStream` reuses the existing `AudioContext` rather than building one. Its `sampleRate` is fixed
at construction and `convertTo16kPcm` reads it, so a fresh context would resample every frame
against the wrong rate - quietly, and only for users whose second device runs at a different rate
than their first.

Its bail-out tests the context **alone**, never also the worklet node, and that is not tidiness.
`start()` creates `source` from `this.stream` and only assigns `workletNode` after
`await addModule()`, so there is a real window where a context and a source exist and the node does
not. An early return covering that window leaves `source` bound to the stream the caller is about
to stop, and `start()` then wires that dead source into the graph: socket up, channel relaying
silence for the rest of the session, nothing reporting it. The worklet connect is guarded instead,
because `start()` has its own `source.connect(workletNode)` and reads `this.source` - which is the
replacement by then.

Only `ch_1` moves. `ch_0` is loopback audio captured from the call and has no device to change.

The setting is persisted before the swap and never rolled back on failure, the same as the language
picker: a failed swap leaves the audio running, so reverting would only remove the user's route to
the device they picked.

**And the same consequence: the picker then names a microphone the session is not using.** That is
the state where the interviewer has just said they cannot hear you, so it is carried on the control
bar rather than only in the dialog - `failedDeviceName` raises the same badge a missing device
raises, and the dialog names the device that failed. Nobody opens a dialog spontaneously
mid-interview. It clears on a swap that succeeds and on leaving `Running`.

The dialog's running-state line is one conditional chain rather than sibling `&&` blocks, and that
is not style: written as siblings, retrying after a failure was both `switching` and
`failedDeviceName` and satisfied neither, so the line vanished at exactly the moment the user was
waiting to hear whether it had worked.

The tests are source-level, unusually for this directory - every other one loads a built
main-process module, and this is renderer code with no runtime harness. They are worth the
awkwardness because the ordering above is what a later tidy-up breaks, with no symptom a type
checker or a linter can see.

### Navigation and external links

The panels render Markdown that came from a language model, and `remark-gfm` autolinks bare URLs,
so an anchor in this app is not necessarily one a person wrote. `installNavigationGuard()`
([src/main/navigation-guard.ts](src/main/navigation-guard.ts)) is installed before the window's
first load and closes the two routes that follow from that, neither of which announced itself.

`setWindowOpenHandler` denies **every** new window. A `target="_blank"` anchor - which is what
`SafeMarkdown` renders - asks Electron for one, and with no handler installed the default is to
make it: a chromeless BrowserWindow with no address bar showing a page the user did not choose.
A web URL is handed to the real browser instead, through `setImmediate` as Electron's own
guidance requires.

`will-navigate` pins the window to the app's own document. An anchor without a target navigates
the frame it is in, and that frame is the app - preload runs on whatever document loads next, so
a remote page would inherit `window.electronAPI`, and with it the session token through
`config.get()` and the candidate's CV through `account.get()`. `file:` origins serialize to
`"null"`, so the packaged build is matched on its exact document URL rather than on an origin
comparison that could never hold.

Both routes and the `external:open` IPC handler go through the same `openExternally()`, which
allows `http:`, `https:` and `mailto:` only. `shell.openExternal` delegates to the OS protocol
handler, so `file:` launches whatever the path points at and a registered custom scheme runs
whatever claimed it. `test/navigation-guard.test.mjs` pins all three.

### Routing

Hash-based router (required for Electron `file://` protocol). Routes: `/` (the launch hub, and the only screen that redirects) -> `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/onboarding` -> `/main` (live assistant), `/mock-interview`, `/account`, `/configuration`, `/payment`, `/documentation`.

**First-run setup.** `/` sends a signed-in user to `/onboarding` when the account's `onboardingCompleted` is false, and it waits for `interviewConfigLoaded` before acting: the flag lives on the account, so until that account has been read this session its value is the default rather than an answer, and acting sooner would flash the wizard at every user on launch and show it in full to anyone whose pull failed. The wizard writes the flag through `account:set-onboarding-completed`, and only after the backend confirms - an optimistic write would let a failed save look like a finished setup until the next launch put the wizard back. Sign-in lands on `/` rather than `/main` for this reason: `/main` is the one route the gate does not cover.

The wizard also holds a session-local dismissal (`use-onboarding-dismissed.ts`) that the gate reads alongside the flag. Its write to the account resolves over one IPC message and the app state carrying the result arrives over another, with nothing ordering the two - so home re-rendered on the old value the instant the wizard navigated to it and sent the user straight back in, running the whole thing twice. The account flag is what makes setup done; the dismissal is what makes it done *now*. It is cleared on sign-out, or the next account to sign in during the same run would inherit it.

`/onboarding` renders regardless of the flag, which is what lets Configuration offer *Run setup* and what makes Skip safe rather than final. The titlebar menu drops Home, Account and Configuration while it is open - Home would bounce straight back, and the other two are what the wizard is in the middle of collecting.

**An absent `onboarding_completed` counts as done**, not as false (`AccountService.readsAsOnboarded`). A backend deployment that predates the field omits it, and reading that as "not done" would put every user of that deployment into the wizard with no way out - the only two exits from it, Finish and Skip, both write through an endpoint that deployment does not have either. Guessing wrong in that direction locks the app; guessing wrong in the other costs a screen nobody saw.

`/auth/forgot-password` is a three-step wizard shaped like the signup one (email -> code -> password), and the reset is code-based rather than an emailed link because a link opens the system browser, which has no way to hand a token back without a registered deep-link protocol handler.

**Step one advances on success alone and never reports "no such account".** The backend answers `forgot-password` identically for a registered and an unregistered address so that the endpoint cannot be used to test who has one, and a UI that reported the difference would hand that oracle straight back - which is why the copy on step two is conditional ("if an account exists for..."). `AuthService.forgotPassword` resolving true means the request went through, nothing more.

**The signup wizard works the same way, for the same reason.** `send-verification-code` used to answer 409 for an address that already had an account, so signup reported it inline and immediately - which made the care taken in the reset wizard pointless, since the same question was answerable one screen over. The backend now answers 200 either way and mails a code to a free address or a "you already have an account" notice to a taken one, so signup's step two copy is conditional in the same shape ("if x@y.z does not already have an account...") and mentions the notice, because for that user the code they are waiting to paste is never coming. `AuthService.sendVerificationCode` resolving true means the request went through, not that the address is free.

`AuthService.resetPassword` rewrites the stored password behind **two** guards, `rememberMe` and the address matching the remembered one. The login form pre-fills from that store, so skipping the write leaves a filled-in password that has just stopped working; writing it on `rememberMe` alone puts credentials on disk for a user who did not opt in. The address check is specific to reset, the only password flow that runs while signed out and therefore the only one that can be run for an account other than the remembered one - on a shared machine, writing unconditionally would replace someone else's remembered login with this one. That write is wrapped in its own `try`, separate from the request. By the time it runs the password has already changed and the code is spent, so letting a disk failure decide the return value would report a failure for a reset that succeeded and send the user to retry with a code that can no longer work - the same trap the login form avoids when it persists remember-me. `test/password-reset.test.mjs` pins all of it, including the failed-reset case and a store that throws.

The final step latches on success. `loading` is already back to false while the two-second redirect runs, so a live button there would let a second click resend a code the backend has just spent, toasting a guaranteed failure over the success still on screen.

It also carries its own way out, which the signup wizard does not need. `AuthLayout` renders this card and nothing else - no navigation of its own - and the reset code expires on `PASSWORD_RESET_CODE_EXPIRE_MINUTES` while the user is choosing a password. A failure there is therefore both likely and unrecoverable in place, since retrying the same dead code cannot succeed, so the step offers `Start over` (back to step one, address kept and code dropped) and a link to sign in, and the failure copy sends the user for a new code rather than telling them to try again.

### Window and Stealth Mode

The main window reference is passed to `windowControlService` and `zoomService` after creation. Window bounds persist to Electron Store on `close` and are restored on next launch with minimum-size clamping (`MIN_WIDTH` / `MIN_HEIGHT` from [src/main/consts.ts](src/main/consts.ts)).

The app keeps itself off the surfaces a screen share exposes, but only where it has to. There is never a desktop shortcut (the NSIS installer creates none, and `build/installer.nsh` deletes one left by an older install). The taskbar button and the macOS Dock icon are driven by `applySurfaceVisibility()` in [src/main/services/window-control.service.ts](src/main/services/window-control.service.ts) - `setSkipTaskbar(hidden)` plus, on macOS, `app.setActivationPolicy('accessory')` + `app.dock.hide()` going in and `'regular'` + `app.dock.show()` coming out. There is deliberately no `LSUIElement` in the packaged Info.plist: it would pin the app to accessory from launch and there would be no Dock icon to give back.

`hidden` comes from `shouldHideSurfaces()`, which is `_stealth || isAssistantRunning()`. **The two inputs are independent, not nested.** A running assistant is when a screen share is most likely live, so it hides the same surfaces stealth does; leaving stealth mid-session must therefore *not* hand the taskbar button back. The macOS traffic lights are the deliberate exception - they follow `_stealth` alone, because a merely running window is still focusable and interactive and needs its close and minimise buttons. `test/running-surface.test.mjs` pins all of it.

Two consequences. A window minimized *in stealth mode* has no button to click, so it can only be brought back by relaunching the app - the single instance lock routes to `restoreWindow()`. And `window-all-closed` quits on every platform including macOS, because a windowless process in stealth mode would otherwise sit there holding the global hotkeys unreachable. `test/stealth-surface.test.mjs` pins all of it.

Always-on-top follows the same `shouldHideSurfaces()` predicate and is owned by `applySurfaceVisibility()`, not by the stealth toggles - that is what keeps the pin when stealth is switched off mid-session. The level is `'screen-saver'`: levels from `'floating'` to `'status'` put the window *below* the Dock and taskbar, so only `'pop-up-menu'` and above are actually on top. `setVisibleOnAllWorkspaces(pinned, { visibleOnFullScreen: pinned })` goes with it, because on macOS an always-on-top window still vanishes when the user switches to a fullscreen Space - which is how most people run a video call. Within `applySurfaceVisibility()` the z-order call must come **before** `setSkipTaskbar`, since changing it re-registers the window with the shell.

Hiding the taskbar button is *registration* state (`ITaskbarList::DeleteTab` on Windows), not a window style, so it does not survive `setFocusable` or z-order changes - the button reappears after a stealth toggle. `applySurfaceVisibility()` re-asserts the right state, is wired to the window's `show`/`restore`/`maximize`/`unmaximize` events, and must be called after anything that reshapes or re-shows the window - and after `_stealth` is updated, since it reads it. `test/stealth-toggle.test.mjs` pins that.

The Dock half has a failure mode of its own: **macOS drops a Dock call made within one second of the previous one**, silently. Toggling stealth twice quickly would otherwise leave the icon on screen for the rest of the session. `applyDockVisibility()` therefore skips no-op calls (so window events do not spend the one-second budget), and when a call does land inside the window it schedules a re-assert `DOCK_RATE_LIMIT_MS` later that re-reads `_stealth`. The activation policy carries no such limit and is applied immediately, so the icon still goes away at once in the swallowed case. `test/stealth-dock.test.mjs` pins this; it loads a second copy of the service through `loadMainAs('darwin', ...)`, since these branches are dead code on the Linux runner CI uses.

Whether the *shell* actually acts on `setSkipTaskbar` is not something a unit test can reach, and it fails without an error. `test/manual/taskbar-probe.mjs` drives the real service in a real Electron process and reads the taskbar back through UI Automation - Windows only, run by hand (`pnpm exec electron test/manual/taskbar-probe.mjs`), deliberately not in `test/run.mjs`.

Stealth mode hides the window from screen capture via `setContentProtection`. The main process emits `stealth-changed`; the preload script toggles a `stealth` CSS class on `document.body`. Content protection is on by default; pass `--disable-content-protection` at launch to disable it (dev/testing only).

Background throttling is disabled globally (via `app.commandLine` switches and `backgroundThrottling: false` in `webPreferences`) so audio keeps running when the window is occluded.

### Backend and Constants

Backend URL: `localhost:8080` in dev, `api.powerinterviewai.com` in prod - switched by `EnvUtil.isDev()` in [src/main/consts.ts](src/main/consts.ts). All feature constants (zoom steps, suggestion gaps, transcript merge window) live in the same file.

[src/main/api/client.ts](src/main/api/client.ts) reads `sessionToken` from the config store before every request and sets it as the Bearer token. Streaming responses return a raw `ReadableStream<Uint8Array>`.

## Project Spec

See [SPEC.md](SPEC.md) for full feature details, tech stack table, and platform support.
