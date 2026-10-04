import { isMac } from './consts';

export enum Hotkey {
  StopAll = 'StopAll',
  ToggleStealth = 'ToggleStealth',
  Opacity = 'Opacity',
  ToggleTranscript = 'ToggleTranscript',
  ToggleSuggestionMode = 'ToggleSuggestionMode',
  PlaceWin = 'PlaceWin',
  MoveWin = 'MoveWin',
  ResizeWin = 'ResizeWin',
  ZoomInOutReset = 'ZoomInOutReset',
  ScrollLiveSuggestionPanel = 'ScrollLiveSuggestionPanel',
  ScrollActionSuggestionPanel = 'ScrollActionSuggestionPanel',
  Capture = 'Capture',
  ClearCaptures = 'ClearCaptures',
  TriggerWithoutCaptures = 'TriggerWithoutCaptures',
  TriggerWithCaptures = 'TriggerWithCaptures',
}
export const HOTKEY_LIST: Hotkey[] = Object.values(Hotkey);

/**
 * Groups of hotkeys organized by functional area.  Useful for display
 * in menus or tooltips where related shortcuts should be clustered.
 *
 * `id` indexes `t.hotkeys.groups` rather than carrying the label itself. Everything in this file
 * that a user reads as a sentence moved to the locale; what is left is the combos, which are
 * keyboard notation and the one thing here that depends on the platform rather than the reader.
 */
export type HotkeyGroupId = 'general' | 'window' | 'panels' | 'triggered';

export type HotkeyGroup = {
  id: HotkeyGroupId;
  keys: Hotkey[];
};

export const HOTKEY_GROUPS: HotkeyGroup[] = [
  {
    id: 'general',
    keys: [
      Hotkey.StopAll,
      Hotkey.ToggleStealth,
      Hotkey.Opacity,
      Hotkey.ToggleTranscript,
      Hotkey.ToggleSuggestionMode,
    ],
  },
  {
    id: 'window',
    keys: [Hotkey.PlaceWin, Hotkey.MoveWin, Hotkey.ResizeWin, Hotkey.ZoomInOutReset],
  },
  {
    id: 'panels',
    keys: [Hotkey.ScrollLiveSuggestionPanel, Hotkey.ScrollActionSuggestionPanel],
  },
  {
    id: 'triggered',
    keys: [
      Hotkey.Capture,
      Hotkey.ClearCaptures,
      Hotkey.TriggerWithoutCaptures,
      Hotkey.TriggerWithCaptures,
    ],
  },
];

export interface HotkeyInfo {
  combo: string;
}

// Base modifier: macOS = ⌃⌥ (Ctrl+Option), others = Ctrl+Shift text
const BASE = isMac ? '⌃⌥' : 'Ctrl+Shift+';
const MOVE = isMac ? '⌃⌥⇧' : 'Ctrl+Alt+Shift+';
const RESIZE = isMac ? '⌃⌥⌘' : 'Ctrl+Win+Shift+';

/** Format a single key with the platform base modifier */
export function formatCombo(key: string): string {
  return `${BASE}${key}`;
}

export const HOTKEYS: Record<Hotkey, HotkeyInfo> = {
  [Hotkey.StopAll]: { combo: `${BASE}Q` },
  [Hotkey.ToggleStealth]: { combo: `${BASE}M` },
  [Hotkey.Opacity]: { combo: `${BASE}N` },
  [Hotkey.ToggleTranscript]: { combo: `${BASE}F8` },
  [Hotkey.ToggleSuggestionMode]: { combo: `${BASE}F7` },
  [Hotkey.PlaceWin]: { combo: `${BASE}1-9` },
  [Hotkey.MoveWin]: { combo: `${MOVE}[↑↓←→]` },
  [Hotkey.ResizeWin]: { combo: `${RESIZE}[↑↓←→]` },
  [Hotkey.ZoomInOutReset]: { combo: `${BASE}[=  -  0]` },
  [Hotkey.ScrollLiveSuggestionPanel]: { combo: `${BASE}[J  K  L]` },
  [Hotkey.ScrollActionSuggestionPanel]: { combo: `${BASE}[U  I  O]` },
  [Hotkey.Capture]: { combo: `${BASE}F9` },
  [Hotkey.ClearCaptures]: { combo: `${BASE}F10` },
  [Hotkey.TriggerWithoutCaptures]: { combo: `${BASE}F11` },
  [Hotkey.TriggerWithCaptures]: { combo: `${BASE}F12` },
};
