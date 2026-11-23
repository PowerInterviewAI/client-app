import { Keyboard, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HotkeyCheatsheetDialog } from '@/components/custom/hotkey-cheatsheet';
import PageHeader from '@/components/custom/page-header';
import { AllowScreenCaptureField } from '@/components/custom/settings/allow-screen-capture-field';
import { HideTaskbarField } from '@/components/custom/settings/hide-taskbar-field';
import { LanguageField } from '@/components/custom/settings/language-field';
import { MicrophoneField } from '@/components/custom/settings/microphone-field';
import { MockHintsField } from '@/components/custom/settings/mock-hints-field';
import { SettingsSection } from '@/components/custom/settings/settings-section';
import { SuggestionModeField } from '@/components/custom/settings/suggestion-mode-field';
import { TranscriptPanelField } from '@/components/custom/settings/transcript-panel-field';
import { UiLanguageField } from '@/components/custom/settings/ui-language-field';
import { ZoomField } from '@/components/custom/settings/zoom-field';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n';

/**
 * How the interview runs: the microphone, the language, how suggestions read, whether mock
 * interviews show them at all, and whether the transcript is docked - and above all of it, the
 * language the app itself is in, which is the one setting here that is not about an interview.
 *
 * Every control here writes straight through to the config store as it is changed - there is no
 * Save button, because there is nothing to batch and nothing that could be half-applied. That is
 * the other reason this is not a tab of the account page, which does have a Save and does need
 * one.
 *
 * These are the same settings the first-run wizard walks a new user through, rendered from the
 * same components, so what the wizard set is what this page shows.
 */
export default function ConfigurationPage() {
  const t = useT();
  const navigate = useNavigate();
  const [hotkeysOpen, setHotkeysOpen] = useState(false);

  return (
    <div className="w-full flex flex-col bg-background">
      <PageHeader title={t.configuration.title} />

      <div className="flex-1 overflow-auto px-6 py-6 w-full max-w-2xl mx-auto space-y-7">
        {/* First, and in a group of its own: it is the only control on this page that is not
            about how an interview runs, and it is the one someone arrives here looking for when
            the app is in a language they do not read. */}
        <SettingsSection title={t.configuration.sections.general}>
          <UiLanguageField />
        </SettingsSection>

        <SettingsSection title={t.configuration.sections.interview}>
          <MicrophoneField />
          <LanguageField />
          <SuggestionModeField />
          <MockHintsField />
        </SettingsSection>

        <SettingsSection title={t.configuration.sections.display}>
          <ZoomField />
          <TranscriptPanelField />
        </SettingsSection>

        <SettingsSection title={t.configuration.sections.window}>
          <HideTaskbarField />
          <AllowScreenCaptureField />
        </SettingsSection>

        {/* The wizard is not a one-time thing the user is stuck having skipped. Reachable here
            rather than only on a first launch, which is also what lets it be skippable without
            that being a decision: `/onboarding` renders regardless of the account's flag, and
            finishing it simply records the same flag again. */}
        <SettingsSection title={t.configuration.sections.help}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t.configuration.setupGuide.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.configuration.setupGuide.description}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/onboarding')}>
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              {t.configuration.setupGuide.action}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <div>
              <p className="text-sm font-medium">{t.configuration.hotkeys.title}</p>
              <p className="text-xs text-muted-foreground">{t.configuration.hotkeys.description}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setHotkeysOpen(true)}>
              <Keyboard className="h-4 w-4" aria-hidden="true" />
              {t.common.view}
            </Button>
          </div>
        </SettingsSection>
      </div>

      <HotkeyCheatsheetDialog open={hotkeysOpen} onOpenChange={setHotkeysOpen} />
    </div>
  );
}
