import {
  BookOpen,
  Captions as TranscriptIcon,
  CreditCard,
  EyeOff,
  Home,
  Keyboard,
  ListChecks,
  LogOut,
  Mic,
  MonitorPlay,
  Moon,
  Play,
  Route,
  SettingsIcon,
  Square,
  Sun,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HotkeyCheatsheetDialog } from '@/components/custom/hotkey-cheatsheet';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAppState } from '@/hooks/use-app-state';
import useAuth from '@/hooks/use-auth';
import { useCommandPaletteStore } from '@/hooks/use-command-palette';
import { useEndLiveSession } from '@/hooks/use-end-live-session';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useSuggestionMode } from '@/hooks/use-suggestion-mode';
import { useThemeStore } from '@/hooks/use-theme-store';
import { useTranscriptPanel } from '@/hooks/use-transcript-panel';
import { isMac } from '@/lib/consts';
import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

/**
 * Not a registered Hotkey (lib/hotkeys.ts): like the cheat-sheet's `?`, this only needs the
 * window focused, not a system-wide binding via Electron's globalShortcut. Registering Cmd/Ctrl+K
 * globally would steal that combo from every other app on the machine whenever this one is merely
 * running - the exact opposite of what a command palette should do.
 */
function useCommandPaletteHotkey() {
  const toggle = useCommandPaletteStore((s) => s.toggle);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);
}

export function CommandPalette() {
  useCommandPaletteHotkey();

  const isStealth = useIsStealthMode();
  const navigate = useNavigate();
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);

  const { appState, runningState } = useAppState();
  const endLiveSession = useEndLiveSession();
  const { logout } = useAuth();
  const { hintOnly, toggle: toggleSuggestionMode } = useSuggestionMode();
  const { visible: transcriptVisible, toggle: toggleTranscript } = useTranscriptPanel();
  const { isDark, toggleTheme } = useThemeStore();

  const [isHotkeysOpen, setIsHotkeysOpen] = useState(false);

  // Stealth mode hides the app's visible surface during screen share - a palette popping up
  // over that would defeat the point, so it stays fully inert (including the hotkey) while active.
  if (isStealth) return null;

  const isLoggedIn = appState?.isLoggedIn ?? false;
  const isRunning = runningState === RunningState.Running || runningState === RunningState.Starting;

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command Palette"
        description="Search for an action, page, or setting."
      >
        <CommandInput placeholder="Search actions..." />
        <CommandList>
          <CommandEmpty>No matching action.</CommandEmpty>

          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => run(() => navigate('/'))}>
              <Home />
              Home
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate('/main'))}>
              <MonitorPlay />
              Interview console
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate('/account'))}>
              <UserRound />
              Account
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate('/configuration'))}>
              <SettingsIcon />
              Configuration
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate('/payment'))}>
              <CreditCard />
              Buy Credits
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Session">
            {/* Both starts hand off to `/main` through router state rather than starting anything
                here: the control panel there owns the whole start sequence, and the palette is
                reachable from every route, including ones where none of it is mounted. Named the
                way the home page names them, because they are the same two actions. */}
            {!isRunning && (
              <>
                <CommandItem
                  onSelect={() =>
                    run(() => navigate('/', { state: { openMockSetup: true } }))
                  }
                >
                  <Mic />
                  Start mock interview
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    run(() => navigate('/main', { state: { autoStartLive: true } }))
                  }
                >
                  <Play />
                  Start live assistant
                </CommandItem>
              </>
            )}
            {isRunning && (
              <CommandItem onSelect={() => run(() => void endLiveSession())}>
                <Square />
                Stop interview
              </CommandItem>
            )}
            <CommandItem onSelect={() => run(toggleSuggestionMode)}>
              {hintOnly ? <ListChecks /> : <Route className="-scale-y-100" />}
              {hintOnly ? 'Switch to full-sentence mode' : 'Switch to hint-only mode'}
            </CommandItem>
            <CommandItem onSelect={() => run(toggleTranscript)}>
              <TranscriptIcon />
              {transcriptVisible ? 'Hide Transcript' : 'Show Transcript'}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="App">
            <CommandItem onSelect={() => run(() => navigate('/documentation'))}>
              <BookOpen />
              Documentation
            </CommandItem>
            <CommandItem onSelect={() => run(() => setIsHotkeysOpen(true))}>
              <Keyboard />
              Keyboard Shortcuts
            </CommandItem>
            <CommandItem onSelect={() => run(toggleTheme)}>
              {isDark ? <Sun /> : <Moon />}
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </CommandItem>
            {isLoggedIn && (
              <CommandItem onSelect={() => run(() => getElectron()?.toggleStealth())}>
                <EyeOff />
                Toggle Stealth Mode
              </CommandItem>
            )}
            {isLoggedIn && (
              <CommandItem onSelect={() => run(() => void logout())}>
                <LogOut />
                Sign Out
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <HotkeyCheatsheetDialog open={isHotkeysOpen} onOpenChange={setIsHotkeysOpen} />
    </>
  );
}
