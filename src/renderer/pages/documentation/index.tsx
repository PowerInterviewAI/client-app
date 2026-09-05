import { ArrowLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ExternalLink from '@/components/custom/external-link';
import { HotkeyCheatsheet } from '@/components/custom/hotkey-cheatsheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/consts';
import { LANGUAGES } from '@/types/language';

export default function DocumentationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [version, setVersion] = useState<string | null>(null);

  // A reload leaves this page as the first entry in the session history, where navigate(-1) has
  // nowhere to go and silently does nothing. React Router marks that entry with key 'default'.
  const handleBack = () => {
    if (location.key === 'default') navigate('/', { replace: true });
    else navigate(-1);
  };

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
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleBack}
            className="flex items-center shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 className="text-sm font-semibold shrink-0">
            {APP_NAME} {version ? `v${version}` : ''}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-4 w-full max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">
          {APP_NAME} is an AI-powered assistant that enhances your interview experience with
          real-time suggestions, on-screen code recommendations.
        </p>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">
          For full documentation, visit{' '}
          <ExternalLink
            href="https://www.powerinterviewai.com/docs"
            className="text-primary underline"
          >
            powerinterviewai.com/docs
          </ExternalLink>
          . Press Cmd/Ctrl+K anywhere in the app to search for an action.
        </p>

        <Accordion type="multiple" defaultValue={['hotkeys']} className="w-full">
          <AccordionItem value="lost-window">
            <AccordionTrigger className="text-sm font-semibold">
              Lost the window?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                In stealth mode {APP_NAME} leaves the taskbar and the macOS Dock so it is not
                visible when you share your screen, which also means a minimized window has no
                button to click. Just launch {APP_NAME} again: it does not start a second copy, it
                brings this window back. Outside stealth mode the usual taskbar button and Dock
                icon are there.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="language">
            <AccordionTrigger className="text-sm font-semibold">
              Interviewing in another language
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                The language button on the control bar sets the language of the whole session:
                which speech model transcribes the call, what language suggestions are written in,
                and the language of the exported report.
              </p>
              {/* A list rather than a sentence: at 28 entries the run-on paragraph this used to
                  be could not be scanned for one's own language, which is the only question a
                  reader opens this section with. Derived from LANGUAGES so it cannot drift. */}
              <p className="mt-2 text-sm text-muted-foreground">
                {LANGUAGES.length} languages are supported:{' '}
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
                You can change it mid-interview. Suggestions follow immediately, from the next
                answer onward. Speech recognition takes a moment longer: it reconnects, so the
                sentence being spoken at that instant may be cut short in the transcript.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="microphone">
            <AccordionTrigger className="text-sm font-semibold">
              Changing microphone mid-interview
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                The microphone button on the control bar stays available while an interview is
                running. If your headset dies, is unplugged, or was the wrong device to begin
                with, pick another one there rather than stopping the assistant - stopping it
                clears the transcript and the suggestions with it.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                The change takes effect immediately and transcription keeps running, so nothing is
                cut short. If the device you pick cannot be opened - unplugged, or in use by
                another app - the interview carries on using the previous one and the app says so.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hotkeys">
            <AccordionTrigger className="text-sm font-semibold">Hotkeys</AccordionTrigger>
            <AccordionContent>
              <HotkeyCheatsheet />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
