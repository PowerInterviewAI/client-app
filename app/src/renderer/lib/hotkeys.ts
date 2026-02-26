export enum Hotkey {
  StopAll = 'StopAll',
  ToggleStealth = 'ToggleStealth',
  Opacity = 'Opacity',
  PlaceWin = 'PlaceWin',
  MoveWin = 'MoveWin',
  ResizeWin = 'ResizeWin',
  ScrollReplyPanel = 'ScrollReplyPanel',
  ScrollCodePanel = 'ScrollCodePanel',
  Capture = 'Capture',
  ClearCaptures = 'ClearCaptures',
  SubmitCaptures = 'SubmitCaptures',
}
export const HOTKEY_LIST: Hotkey[] = Object.values(Hotkey);

export interface HotkeyInfo {
  combo: string;
  title: string;
  description: string;
}

export const HOTKEYS: Record<Hotkey, HotkeyInfo> = {
  [Hotkey.StopAll]: {
    combo: 'Ctrl+Shift+Q',
    title: 'Stop All',
    description: 'Stop assistant and exit stealth mode',
  },
  [Hotkey.ToggleStealth]: {
    combo: 'Ctrl+Shift+M',
    title: 'Toggle Stealth',
    description: 'Toggle stealth mode on or off',
  },
  [Hotkey.Opacity]: {
    combo: 'Ctrl+Shift+N',
    title: 'Opacity',
    description: 'Toggle window opacity in stealth mode',
  },
  [Hotkey.PlaceWin]: {
    combo: 'Ctrl+Shift+1-9',
    title: 'Place Win',
    description: 'Place window in a specific corner, side, or center',
  },
  [Hotkey.MoveWin]: {
    combo: 'Ctrl+Alt+Shift+Arrow',
    title: 'Move Win',
    description: 'Move window in the specified direction',
  },
  [Hotkey.ResizeWin]: {
    combo: 'Ctrl+Win+Shift+Arrow',
    title: 'Resize Win',
    description: 'Resize window in the specified direction',
  },
  [Hotkey.ScrollReplyPanel]: {
    combo: 'Ctrl+Shift+J / K',
    title: 'Scroll Reply Panel',
    description: 'Scroll Down/Up in the interview reply suggestions panel',
  },
  [Hotkey.ScrollCodePanel]: {
    combo: 'Ctrl+Shift+U / I',
    title: 'Scroll Code Panel',
    description: 'Scroll Down/Up in the coding test suggestions panel',
  },
  [Hotkey.Capture]: {
    combo: 'Ctrl+Alt+Shift+P',
    title: 'Capture',
    description: 'Take a screenshot for code suggestions',
  },
  [Hotkey.ClearCaptures]: {
    combo: 'Ctrl+Alt+Shift+X',
    title: 'Clear Captures',
    description: 'Clear pending screenshots for code suggestions',
  },
  [Hotkey.SubmitCaptures]: {
    combo: 'Ctrl+Alt+Shift+Enter',
    title: 'Submit Captures',
    description: 'Submit prompt for code suggestions',
  },
};
