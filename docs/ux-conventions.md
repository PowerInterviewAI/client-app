# UX Conventions

This app has no design-system package to enforce consistency mechanically — it's one Electron
renderer using shadcn/ui + Tailwind tokens directly. These conventions exist to do the job a
shared library would otherwise do: give every contributor the same answer to "where does this
go" and "how should this look," so the app stays learnable as it grows instead of drifting into
an accretion of one-off menus, dialogs, and hotkeys that only their author can find.

## 1. Placement tiers

Classify every new user-facing capability into exactly one tier before building it. The tier
tells you which surface it belongs on.

| Tier | Definition | Where it lives |
|---|---|---|
| **T0 — Always-visible** | Part of the primary loop, or changed multiple times per session | The control bar (`components/custom/control-panel/*-group.tsx`, styled via `control-panel/bar.ts`) |
| **T1 — Discoverable-on-demand** | Used occasionally per session or per week, not moment-to-moment | The command palette and/or the matching settings page — never a bar icon |
| **T2 — Configure-once** | Set rarely, persists across sessions | Account (`pages/account/index.tsx`) if it is *who the user is*, Configuration (`pages/configuration/index.tsx`) if it is *how the interview runs* — see §6 |
| **T3 — Power-user / hotkey** | Frequent during a live session but must not cost bar space | A hotkey (`lib/hotkeys.ts`), listed in the hotkey cheat-sheet (`hotkey-cheatsheet.tsx`) and, if it has a real renderer-callable action, the command palette (`command-palette.tsx`) — hotkey-only with zero on-screen affordance anywhere is not an acceptable end state |

If a PR adds a new setting or action, its description should say which tier it is and name the
file(s) touched per this table. A tier that doesn't fit cleanly is a signal to ask, not to guess.

A directional or parameterized hotkey (window placement, move, resize, zoom, panel scroll) has no
single "run it" action to put in the palette - those stay hotkey + cheat-sheet only, and that is
the correct, final placement for them, not a gap to fill later.

## 2. The control bar has a fixed budget

The control bar is deliberately compact (every control is 32px tall, one radius, grouped by
spacing rather than dividing rules — see the comment in `control-panel/bar.ts`) because it
overlays the user's screen during a live interview and must not obstruct it. Space there is the
scarcest resource in the app. Adding a control to the bar is a T0 decision, not a default —
prefer Account/Configuration, the cheat-sheet, or the command palette for anything that isn't
part of the primary loop.

## 3. Dialog vs. page

A **transient, in-context action** (confirm a password change, a permission prompt, a save-before-
leaving guard) is a dialog. A **destination** — somewhere a user goes to do a batch of related
things, or that outlives the screen it was opened from — is a routed page, composing the shared
`components/custom/page-header.tsx`: a sticky header with a back button, content below. Use that
component rather than rebuilding the row — it also carries the `location.key === 'default'`
fallback that a reload otherwise turns into a dead back button. Account, Configuration, Documentation (`pages/documentation/index.tsx`) and the first-run
wizard (`pages/onboarding/index.tsx`) are pages for this reason; the hotkey cheat-sheet (`hotkey-cheatsheet.tsx`'s `HotkeyCheatsheetDialog`)
stays a dialog because it's a quick glance meant not to lose your place mid-session.

The app has several independently hand-built dialogs (`change-password-dialog.tsx`,
`headphone-notice-dialog.tsx`, `mock-interview-setup-dialog.tsx`, `permission-gate-dialog.tsx`,
`save-history-dialog.tsx`) and notices (`connecting-notice.tsx`, `trial-user-notice.tsx`). Each
composes `components/ui/dialog.tsx` independently today, which is how small inconsistencies
(header spacing, footer button order, scroll behavior) drift in over time.

New dialogs and notices should compose a shared wrapper once one exists in
`components/custom/app-dialog.tsx` / `app-notice.tsx` (tracked as follow-up work). Until then,
match the closest existing example rather than inventing a new layout, and call out in review if
the shape diverges.

## 4. Design principles (mandatory)

Fixing where something lives is necessary but not sufficient — a technically-discoverable
feature can still fail a non-developer if it doesn't read as polished and easy to use. Every
new or changed UI surface must:

- **Use plain, user-facing language**, not internal identifiers — labels, menu items, and error
  messages are written for the person using the app, not for the codebase (e.g. "Buy Credits",
  not a raw enum or hotkey constant name).
- **Define an explicit state for empty, loading, and error** — no surface ships with only a
  "happy path" and a blank area or unhandled exception for everything else.
- **Stay within the existing token system** (`src/renderer/index.css`: colors, radius, spacing) —
  no ad hoc colors or one-off spacing values.
- **Meet the accessibility baseline already used elsewhere** — `aria-label`s on icon-only
  controls, visible focus states, and keyboard operability, matching the existing control bar and
  dialogs.
- **Keep tone and iconography consistent** with the rest of the app, so unrelated screens read as
  one product.

## 5. Account vs. Configuration

The two settings destinations answer two different questions, and which one a setting belongs on
is decided by the question, not by convenience:

- **Account** (`pages/account/index.tsx`) — *who the user is*: the sign-in identity, the profile
  and job context every suggestion is written from, the password. It writes to the backend
  account, so it has a Save button and a form that can be half-filled.
- **Configuration** (`pages/configuration/index.tsx`) — *how the interview runs*: microphone,
  language, suggestion style, interface size, transcript panel. Every control persists as it is
  changed, so there is no Save button and nothing can be half-applied.

Each setting there is its own component under `components/custom/settings/`, and the account
fields share `hooks/use-account-form.ts`. That is not decoration: the first-run wizard
(`pages/onboarding/index.tsx`) renders the same components, so a control added to one surface
cannot end up looking or behaving differently on the other.

## 6. A setting a new user must set belongs in onboarding

If the app cannot do its job until a setting has a value — the profile it writes answers from, the
microphone it listens through — adding it to a settings page is not enough. It also goes in the
first-run wizard, as one step, rendering the same component. A setting a new user is expected to
discover on their own is one they will discover during their first real interview.

Adding a step means adding an entry to `STEPS` in `pages/onboarding/index.tsx` and rendering the
existing field component for it. Do not write a wizard-only variant of a control.

The wizard is not allowed to become a trap, and a new step must not make it one:

- **Skip stays on every step**, and skipping keeps whatever the user already typed.
- **Only a setting the app genuinely cannot run without may block Continue** - today that is the
  profile alone - and a blocked Continue must say what is missing, not merely be disabled.
- **Every step's setting must have a working default**, so skipping it leaves the app usable.
- **The step renders the same component its settings page does**, so what the wizard taught is
  what the user finds later.

## 7. Definition of done for a new feature/setting

- [ ] Classified into a tier (§1) and placed on the tier's designated surface.
- [ ] If T2: placed on Account or Configuration per §5, as a component under
      `components/custom/settings/`.
- [ ] If a new user must set it before their first interview: a step in the wizard (§6).
- [ ] If T3: added to `lib/hotkeys.ts` and appears in the hotkey cheat-sheet.
- [ ] New dialog/notice, if any, follows §3.
- [ ] New routed page composes `page-header.tsx` (§3).
- [ ] Meets every principle in §4.
- [ ] `pnpm lint` passes.
