export enum Hotkey {
  StopAll = 'StopAll',
  ToggleStealth = 'ToggleStealth',
  Opacity = 'Opacity',
  PlaceWin = 'PlaceWin',
  MoveWin = 'MoveWin',
  ResizeWin = 'ResizeWin',
  ZoomInOutReset = 'ZoomInOutReset',
  ScrollReplyPanel = 'ScrollReplyPanel',
  ScrollCodePanel = 'ScrollCodePanel',
  Capture = 'Capture',
  SubmitCaptures = 'SubmitCaptures',
  ClearCaptures = 'ClearCaptures',
  CaptureAndSubmit = 'CaptureAndSubmit',
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
    description: 'Toggle stealth mode ON or OFF',
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
  [Hotkey.ZoomInOutReset]: {
    combo: 'Ctrl+Shift+= / Ctrl+Shift+- / Ctrl+Shift+0',
    title: 'Zoom In/Out/Reset',
    description: 'Adjust or reset UI zoom level',
  },
  [Hotkey.ScrollReplyPanel]: {
    combo: 'Ctrl+Shift+J / K / L',
    title: 'Scroll Reply Panel',
    description: 'Scroll Down/Up/End in the interview reply suggestions panel',
  },
  [Hotkey.ScrollCodePanel]: {
    combo: 'Ctrl+Shift+U / I / O',
    title: 'Scroll Code Panel',
    description: 'Scroll Down/Up/End in the coding test suggestions panel',
  },
  [Hotkey.Capture]: {
    combo: 'Ctrl+Shift+F9',
    title: 'Capture',
    description: 'Take a screenshot for code suggestions',
  },
  [Hotkey.SubmitCaptures]: {
    combo: 'Ctrl+Shift+F10',
    title: 'Submit Captures',
    description: 'Submit prompt for code suggestions',
  },
  [Hotkey.ClearCaptures]: {
    combo: 'Ctrl+Shift+F11',
    title: 'Clear Captures',
    description: 'Clear pending screenshots for code suggestions',
  },
  [Hotkey.CaptureAndSubmit]: {
    combo: 'Ctrl+Shift+F12',
    title: 'Capture and Submit',
    description: 'Take a screenshot and submit prompt for code suggestions',
  },
};
