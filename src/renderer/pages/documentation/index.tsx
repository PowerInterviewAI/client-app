import React, { useEffect, useState } from 'react';

import ExternalLink from '@/components/custom/external-link';
import { HotkeyCheatsheet } from '@/components/custom/hotkey-cheatsheet';
import PageHeader from '@/components/custom/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useT } from '@/i18n';
import { APP_NAME } from '@/lib/consts';
import { Hotkey, HOTKEYS } from '@/lib/hotkeys';
import { LANGUAGES } from '@/types/language';

export default function DocumentationPage() {
  const t = useT();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.electronAPI?.autoUpdater
        .getVersion()
        .then((res) => {
          if (res?.success && res.version) setVersion(res.version);
        })
        .catch(() => {
          /* ignore */
        });
    } catch (e) {
      console.error('Failed to get app version:', e);
    }
  }, []);

  return (
    <div className="w-full flex flex-col bg-background">
      <PageHeader title={`${APP_NAME} ${version ? `v${version}` : ''}`.trim()} />

      <div className="flex-1 overflow-auto px-4 py-4 w-full max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">{t.documentation.intro(APP_NAME)}</p>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">
          {t.documentation.docsLead}
          <ExternalLink
            href="https://www.powerinterviewai.com/docs"
            className="text-primary underline"
          >
            {t.documentation.docsLinkText}
          </ExternalLink>
          {t.documentation.docsTrailing}
        </p>

        <Accordion type="multiple" defaultValue={['hotkeys']} className="w-full">
          <AccordionItem value="lost-window">
            <AccordionTrigger className="text-sm font-semibold">
              {t.documentation.lostWindow.title}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                {t.documentation.lostWindow.body(APP_NAME)}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="language">
            <AccordionTrigger className="text-sm font-semibold">
              {t.documentation.language.title}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">{t.documentation.language.oneSetting}</p>
              {/* A list rather than a sentence: at 28 entries the run-on paragraph this used to
                  be could not be scanned for one's own language, which is the only question a
                  reader opens this section with. Derived from LANGUAGES so it cannot drift. */}
              <p className="mt-2 text-sm text-muted-foreground">
                {t.documentation.language.supported(LANGUAGES.length)}
                {/* Each name is its own isolate rather than one `dir="auto"` span around the
                    lot. Joined into a single string, the two right-to-left names sit adjacent
                    with only a neutral between them, so the bidi algorithm resolves that
                    separator right-to-left too and lays the pair out as one run - printing the
                    last two languages in the list in the opposite order to every other pair. */}
                {LANGUAGES.map((language, index) => (
                  <React.Fragment key={language.code}>
                    {index > 0 && ' · '}
                    <bdi>{language.nativeName}</bdi>
                  </React.Fragment>
                ))}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.documentation.language.midInterview}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.documentation.language.textOnly}
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* The chrome language is a second setting, and this is the only place that says so in
              full. The two are routinely different for one user, and nothing in the app infers
              either from the other - which is worth stating where someone goes looking. */}
          <AccordionItem value="app-language">
            <AccordionTrigger className="text-sm font-semibold">
              {t.documentation.language.appLanguageTitle}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                {t.documentation.language.appLanguageBody}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="microphone">
            <AccordionTrigger className="text-sm font-semibold">
              {t.documentation.microphone.title}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">{t.documentation.microphone.body}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.documentation.microphone.immediate}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="suggestion-style">
            <AccordionTrigger className="text-sm font-semibold">
              {t.documentation.suggestionStyle.title}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                {t.documentation.suggestionStyle.body}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.documentation.suggestionStyle.switching(
                  HOTKEYS[Hotkey.ToggleSuggestionMode].combo
                )}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="where-things-are">
            <AccordionTrigger className="text-sm font-semibold">
              {t.documentation.settings.title}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{t.documentation.settings.accountLabel}</strong>
                {t.documentation.settings.accountBody}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                <strong className="text-foreground">
                  {t.documentation.settings.configurationLabel}
                </strong>
                {t.documentation.settings.configurationBody}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{t.documentation.settings.both}</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hotkeys">
            <AccordionTrigger className="text-sm font-semibold">
              {t.documentation.hotkeys}
            </AccordionTrigger>
            <AccordionContent>
              <HotkeyCheatsheet />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
