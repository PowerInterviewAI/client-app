import { useEffect } from 'react';

/**
 * Custom hook to listen for hotkey scroll events from Electron
 * @param section - The section to listen for ('0' for interview suggestions, '1' for code suggestions)
 * @param onScroll - Callback function to handle scroll events
 */
export function useHotkeyScroll(section: string, onScroll: (direction: 'up' | 'down') => void) {
  useEffect(() => {
    // Check if electronAPI is available (running in Electron)
    if (typeof window !== 'undefined' && window.electronAPI?.onHotkeyScroll) {
      const unsubscribe = window.electronAPI.onHotkeyScroll((receivedSection, direction) => {
        if (receivedSection === section) {
          onScroll(direction as 'up' | 'down');
        }
      });

      return unsubscribe;
    }
  }, [section, onScroll]);
}

/**
 * Custom hook to access Electron window controls
 */
export function useWindowControls() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return {
      minimize: window.electronAPI.minimize ?? (() => {}),
      maximize: window.electronAPI.maximize ?? (() => {}),
      close: window.electronAPI.close ?? (() => {}),
      resizeWindowDelta: window.electronAPI.resizeWindowDelta ?? (() => {}),
      setStealth: window.electronAPI.setStealth ?? (() => {}),
      toggleStealth: window.electronAPI.toggleStealth ?? (() => {}),
      toggleOpacity: window.electronAPI.toggleOpacity ?? (() => {}),
    };
  }

  // Return no-op functions if not in Electron
  return {
    minimize: () => {},
    maximize: () => {},
    close: () => {},
    resizeWindowDelta: () => {},
    setStealth: () => {},
    toggleStealth: () => {},
    toggleOpacity: () => {},
  };
}
