import {
  BookOpen,
  Captions as TranscriptIcon,
  CreditCard,
  EyeOff,
  Home,
  Keyboard,
  ListChecks,
  LogOut,
  Moon,
  Play,
  Route,
  SettingsIcon,
  Square,
  Sun,
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
import { useAssistantService } from '@/hooks/use-assistant-service';
import useAuth from '@/hooks/use-auth';
import { useCommandPaletteStore } from '@/hooks/use-command-palette';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useProfessionalMode } from '@/hooks/use-professional-mode';
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
  const { stopAssistant } = useAssistantService();
  const { logout } = useAuth();
  const { enabled: professionalMode, toggle: toggleProfessionalMode } = useProfessionalMode();
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
              <Play />
              Start Interview
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate('/payment'))}>
              <CreditCard />
              Buy Credits
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Session">
            {isRunning && (
              <CommandItem onSelect={() => run(() => void stopAssistant())}>
                <Square />
                Stop Interview
              </CommandItem>
            )}
            <CommandItem onSelect={() => run(toggleProfessionalMode)}>
              {professionalMode ? <ListChecks /> : <Route className="-scale-y-100" />}
              {professionalMode ? 'Switch to Normal Suggestions' : 'Switch to Professional Mode'}
            </CommandItem>
            <CommandItem onSelect={() => run(toggleTranscript)}>
              <TranscriptIcon />
              {transcriptVisible ? 'Hide Transcript' : 'Show Transcript'}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="App">
            <CommandItem onSelect={() => run(() => navigate('/settings'))}>
              <SettingsIcon />
              Settings
            </CommandItem>
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
