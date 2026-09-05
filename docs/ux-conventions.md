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
| **T1 — Discoverable-on-demand** | Used occasionally per session or per week, not moment-to-moment | The command palette and/or the Settings page — never a bar icon |
| **T2 — Configure-once** | Set rarely, persists across sessions | The Settings page (`pages/settings/index.tsx`) |
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
prefer Settings, the cheat-sheet, or the command palette for anything that isn't part of the
primary loop.

## 3. Dialog vs. page

A **transient, in-context action** (confirm a password change, a permission prompt, a save-before-
leaving guard) is a dialog. A **destination** — somewhere a user goes to do a batch of related
things, or that outlives the screen it was opened from — is a routed page, following the same
pattern `pages/payment/index.tsx` already established: a sticky header with a back button, content
below. Settings (`pages/settings/index.tsx`) and Documentation (`pages/documentation/index.tsx`)
are pages for this reason; the hotkey cheat-sheet (`hotkey-cheatsheet.tsx`'s `HotkeyCheatsheetDialog`)
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
feature can still fail a non-developer if it doesn't read as professional and easy to use. Every
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

## 5. Definition of done for a new feature/setting

- [ ] Classified into a tier (§1) and placed on the tier's designated surface.
- [ ] If T3: added to `lib/hotkeys.ts` and appears in the hotkey cheat-sheet.
- [ ] New dialog/notice, if any, follows §3.
- [ ] Meets every principle in §4.
- [ ] `pnpm lint` passes.
