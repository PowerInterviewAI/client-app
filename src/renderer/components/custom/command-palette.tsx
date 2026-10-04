import {
  BookOpen,
  Captions as TranscriptIcon,
  CreditCard,
  Home,
  Keyboard,
  ListChecks,
  LogOut,
  Mic,
  Moon,
  Play,
  Route,
  SettingsIcon,
  Sun,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
import { useInterviewLock } from '@/hooks/use-interview-lock';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import { useSaveHistoryGuard } from '@/hooks/use-save-history-guard';
import { useSuggestionMode } from '@/hooks/use-suggestion-mode';
import { useThemeStore } from '@/hooks/use-theme-store';
import { useTranscriptPanel } from '@/hooks/use-transcript-panel';
import { useT } from '@/i18n';
import { isMac } from '@/lib/consts';

/**
 * Not a registered Hotkey (lib/hotkeys.ts): like the cheat-sheet's `?`, this only needs the
 * window focused, not a system-wide binding via Electron's globalShortcut. Registering Cmd/Ctrl+K
 * globally would steal that combo from every other app on the machine whenever this one is merely
 * running - the exact opposite of what a command palette should do.
 *
 * Not registered at all while `inert` - stealth mode. The component returns null there, so the
 * key press was not opening anything on screen; it was flipping the store's `open` to true behind
 * a palette that does not render, which then appeared unasked-for the moment stealth was turned
 * off. Left unregistered rather than merely ignored so the combo also goes back to the app
 * underneath, which is the whole point of stealth.
 */
function useCommandPaletteHotkey(inert: boolean) {
  const toggle = useCommandPaletteStore((s) => s.toggle);

  useEffect(() => {
    if (inert) return;
    const handler = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inert, toggle]);
}

export function CommandPalette() {
  const t = useT();
  const isStealth = useIsStealthMode();
  // Inert during an interview for the same reason it is inert in stealth mode, and stated the
  // same way: every entry it carries is a navigation, a session start, or a sign-out, and all
  // three are refused while one is running. Left merely disabled, Cmd/Ctrl+K would still open a
  // list in which nothing worked; unregistered, the combo goes back to whatever else wants it.
  const { locked } = useInterviewLock();
  useCommandPaletteHotkey(isStealth || locked);

  const navigate = useNavigate();
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);

  const { appState } = useAppState();
  const { logout } = useAuth();
  const { confirmDiscard } = useSaveHistoryGuard();
  const { hintOnly, toggle: toggleSuggestionMode } = useSuggestionMode();
  const { visible: transcriptVisible, toggle: toggleTranscript } = useTranscriptPanel();
  const { isDark, toggleTheme } = useThemeStore();

  const [isHotkeysOpen, setIsHotkeysOpen] = useState(false);

  // Stealth can be turned on while the palette is open - the hotkey for it is global and reaches
  // the app whatever has focus. Closed rather than left standing, so it is not waiting on screen
  // when stealth comes back off. A session starting while it is open is the same shape: the two
  // Start entries are how that happens, and the palette must not survive its own action.
  useEffect(() => {
    if (isStealth || locked) setOpen(false);
  }, [isStealth, locked, setOpen]);

  // Stealth mode hides the app's visible surface during screen share - a palette popping up
  // over that would defeat the point, so it stays fully inert (including the hotkey) while active.
  if (isStealth || locked) return null;

  const isLoggedIn = appState?.isLoggedIn ?? false;

  // Dropped from the list rather than shown disabled, which is what the palette does with every
  // other action it cannot offer. Only an explicit `false` hides it - see the app state's
  // `mockInterviewSupported` for why an unanswered probe still counts as available.
  const mockUnsupported = appState?.mockInterviewSupported === false;

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  /**
   * Sign out, behind the same guard as every other route to it.
   *
   * This one used to call `logout()` outright: no prompt, so the interview went from
   * main-process memory with nothing having written it to disk, and no session check, so it was
   * reachable mid-interview from a palette that is open on every route.
   */
  const handleSignOut = async () => {
    if (!(await confirmDiscard('signout'))) return;

    try {
      await logout();
    } catch (err) {
      // Off the caught error, not the hook's `error` state - `logout` sets it and throws in the
      // same tick, so this closure's copy is still last render's value.
      console.error('Sign out failed:', err);
      toast.error(err instanceof Error ? err.message : t.home.signOutFailed);
    }
  };

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t.commandPalette.title}
        description={t.commandPalette.description}
      >
        <CommandInput placeholder={t.commandPalette.searchPlaceholder} />
        <CommandList>
          <CommandEmpty>{t.commandPalette.empty}</CommandEmpty>

          {/* No entry for `/main`. The live console is not a destination you visit - it is where
              a running session is, and the only two ways onto it are starting one (below) and
              coming back to one already running (the home screen's own card). Sending an idle
              user there landed them on a bar whose every control is disabled, with the sole
              working one being the way back. */}
          <CommandGroup heading={t.commandPalette.groups.goTo}>
            <CommandItem onSelect={() => run(() => navigate('/'))}>
              <Home />
              {t.commandPalette.home}
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate('/account'))}>
              <UserRound />
              {t.commandPalette.account}
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate('/configuration'))}>
              <SettingsIcon />
              {t.commandPalette.configuration}
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate('/payment'))}>
              <CreditCard />
              {t.commandPalette.buyCredits}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t.commandPalette.groups.session}>
            {/* Both starts hand off to `/main` through router state rather than starting anything
                here: the control panel there owns the whole start sequence, and the palette is
                reachable from every route, including ones where none of it is mounted. Named the
                way the home page names them, because they are the same two actions.

                There is no Stop entry any more, and no running-state branch around these two:
                the palette does not render at all while a session is running, so the only state
                it is ever open in is the one where starting is what makes sense. Stop lives on
                the interview screen, which is the only screen reachable while one runs. */}
            {!mockUnsupported && (
              <CommandItem
                onSelect={() => run(() => navigate('/', { state: { openMockSetup: true } }))}
              >
                <Mic />
                {t.commandPalette.startMock}
              </CommandItem>
            )}
            <CommandItem
              onSelect={() => run(() => navigate('/main', { state: { autoStartLive: true } }))}
            >
              <Play />
              {t.commandPalette.startLive}
            </CommandItem>
            <CommandItem onSelect={() => run(toggleSuggestionMode)}>
              {hintOnly ? <ListChecks /> : <Route className="-scale-y-100" />}
              {hintOnly ? t.commandPalette.switchToFullSentence : t.commandPalette.switchToHintOnly}
            </CommandItem>
            <CommandItem onSelect={() => run(toggleTranscript)}>
              <TranscriptIcon />
              {transcriptVisible
                ? t.commandPalette.hideTranscript
                : t.commandPalette.showTranscript}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t.commandPalette.groups.app}>
            <CommandItem onSelect={() => run(() => navigate('/documentation'))}>
              <BookOpen />
              {t.commandPalette.documentation}
            </CommandItem>
            <CommandItem onSelect={() => run(() => setIsHotkeysOpen(true))}>
              <Keyboard />
              {t.commandPalette.hotkeys}
            </CommandItem>
            <CommandItem onSelect={() => run(toggleTheme)}>
              {isDark ? <Sun /> : <Moon />}
              {isDark ? t.commandPalette.switchToLight : t.commandPalette.switchToDark}
            </CommandItem>
            {/* Stealth mode is not offered here. It is a live-interview control - it hides the
                app from a screen share that is only happening during a real call - and this
                palette is closed for the whole of one, so an entry here could only ever have
                been reached when it had nothing to hide. The control bar carries it instead. */}
            {isLoggedIn && (
              <CommandItem onSelect={() => run(() => void handleSignOut())}>
                <LogOut />
                {t.commandPalette.signOut}
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <HotkeyCheatsheetDialog open={isHotkeysOpen} onOpenChange={setIsHotkeysOpen} />
    </>
  );
}
