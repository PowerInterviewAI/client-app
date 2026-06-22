import { isMac } from './consts';

export enum Hotkey {
  StopAll = 'StopAll',
  ToggleStealth = 'ToggleStealth',
  Opacity = 'Opacity',
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
 */
export type HotkeyGroup = {
  label: string;
  keys: Hotkey[];
};

export const HOTKEY_GROUPS: HotkeyGroup[] = [
  {
    label: 'General',
    keys: [Hotkey.StopAll, Hotkey.ToggleStealth, Hotkey.Opacity],
  },
  {
    label: 'Window Management',
    keys: [Hotkey.PlaceWin, Hotkey.MoveWin, Hotkey.ResizeWin, Hotkey.ZoomInOutReset],
  },
  {
    label: 'Scroll Panels',
    keys: [Hotkey.ScrollLiveSuggestionPanel, Hotkey.ScrollActionSuggestionPanel],
  },
  {
    label: 'Triggered Suggestions',
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
  title: string;
  description: string;
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
  [Hotkey.StopAll]: {
    combo: `${BASE}Q`,
    title: 'Stop All',
    description: 'Stop assistant and exit stealth mode',
  },
  [Hotkey.ToggleStealth]: {
    combo: `${BASE}M`,
    title: 'Toggle Stealth',
    description: 'Toggle stealth mode ON or OFF',
  },
  [Hotkey.Opacity]: {
    combo: `${BASE}N`,
    title: 'Toggle Opacity',
    description: 'Toggle window opacity in stealth mode',
  },
  [Hotkey.PlaceWin]: {
    combo: `${BASE}1-9`,
    title: 'Place Window',
    description: 'Place window in a specific corner, side, or center',
  },
  [Hotkey.MoveWin]: {
    combo: `${MOVE}[↑↓←→]`,
    title: 'Move Window',
    description: 'Move window in the specified direction',
  },
  [Hotkey.ResizeWin]: {
    combo: `${RESIZE}[↑↓←→]`,
    title: 'Resize Window',
    description: 'Resize window in the specified direction',
  },
  [Hotkey.ZoomInOutReset]: {
    combo: `${BASE}[=  -  0]`,
    title: 'Zoom In/Out/Reset',
    description: 'Adjust or reset UI zoom level',
  },
  [Hotkey.ScrollLiveSuggestionPanel]: {
    combo: `${BASE}[J  K  L]`,
    title: 'Scroll Live Panel',
    description: 'Scroll Down/Up/End in the live suggestions panel',
  },
  [Hotkey.ScrollActionSuggestionPanel]: {
    combo: `${BASE}[U  I  O]`,
    title: 'Scroll Triggered Panel',
    description: 'Scroll Down/Up/End in the triggered suggestions panel',
  },
  [Hotkey.Capture]: {
    combo: `${BASE}F9`,
    title: 'Capture Screen',
    description: 'Take a screenshot for triggered suggestions',
  },
  [Hotkey.ClearCaptures]: {
    combo: `${BASE}F10`,
    title: 'Clear Captures',
    description: 'Clear captured screenshots',
  },
  [Hotkey.TriggerWithoutCaptures]: {
    combo: `${BASE}F11`,
    title: 'Trigger without Captures',
    description: 'Generate suggestion without captures',
  },
  [Hotkey.TriggerWithCaptures]: {
    combo: `${BASE}F12`,
    title: 'Trigger with Captures',
    description:
      'Generate suggestion referencing screen captures. If no captures exist, attempts to take one before generating.',
  },
};
