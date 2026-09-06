import { Keyboard, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HotkeyCheatsheetDialog } from '@/components/custom/hotkey-cheatsheet';
import PageHeader from '@/components/custom/page-header';
import { LanguageField } from '@/components/custom/settings/language-field';
import { MicrophoneField } from '@/components/custom/settings/microphone-field';
import { SuggestionModeField } from '@/components/custom/settings/suggestion-mode-field';
import { TranscriptPanelField } from '@/components/custom/settings/transcript-panel-field';
import { Button } from '@/components/ui/button';

/**
 * How the interview runs: the microphone, the language, how suggestions read, and whether the
 * transcript is docked.
 *
 * Every control here writes straight through to the config store as it is changed - there is no
 * Save button, because there is nothing to batch and nothing that could be half-applied. That is
 * the other reason this is not a tab of the account page, which does have a Save and does need
 * one.
 *
 * These are the same four settings the first-run wizard walks a new user through, rendered from
 * the same components, so what the wizard set is what this page shows.
 */
export default function ConfigurationPage() {
  const navigate = useNavigate();
  const [hotkeysOpen, setHotkeysOpen] = useState(false);

  return (
    <div className="w-full flex flex-col bg-background">
      <PageHeader title="Configuration" />

      <div className="flex-1 overflow-auto px-4 py-4 w-full max-w-2xl mx-auto space-y-6">
        <MicrophoneField />
        <LanguageField />
        <SuggestionModeField />
        <TranscriptPanelField />

        {/* The wizard is not a one-time thing the user is stuck having skipped. Reachable here
            rather than only on a first launch, which is also what lets it be skippable without
            that being a decision: `/onboarding` renders regardless of the account's flag, and
            finishing it simply records the same flag again. */}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-sm font-medium">Setup guide</p>
            <p className="text-xs text-muted-foreground">
              Walk through everything on this page, and your profile, one step at a time.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/onboarding')}>
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            Run setup
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-sm font-medium">Keyboard shortcuts</p>
            <p className="text-xs text-muted-foreground">
              Everything you can reach without touching the app during an interview.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setHotkeysOpen(true)}>
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            View
          </Button>
        </div>
      </div>

      <HotkeyCheatsheetDialog open={hotkeysOpen} onOpenChange={setHotkeysOpen} />
    </div>
  );
}
