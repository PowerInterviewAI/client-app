import { create } from 'zustand';

interface OnboardingDismissedStore {
  /** True once the wizard has been finished or skipped in this run of the app. */
  dismissed: boolean;
  dismiss: () => void;
  reset: () => void;
}

/**
 * "The wizard is done for now", held in the renderer for the length of a session.
 *
 * The durable answer lives on the account. This exists because that answer does not arrive
 * synchronously: `account:set-onboarding-completed` replies over one IPC message and the app
 * state carrying the new flag arrives over a separate push, and nothing orders the two. The
 * wizard navigates home the instant its write resolves, so `/` routinely re-rendered on the old
 * value, decided setup was still pending, and sent the user straight back into the wizard they
 * had just finished - the whole thing twice, every time.
 *
 * So the gate reads both: the account's flag is what makes setup done, and this is what makes it
 * done *now*. Skipping sets it even when the write fails, because refusing to let someone out of
 * a wizard is a worse outcome than asking them again next launch.
 *
 * Reset on sign-out, from `MainFrame` - the app shell, so that every sign-out is seen, including
 * the ones that happen on a route the index page is not mounted on and the ones main declares
 * itself when a token expires. Left standing, the next account to sign in during the same run of
 * the app would inherit a dismissal that was never theirs and never be offered setup at all.
 */
export const useOnboardingDismissed = create<OnboardingDismissedStore>((set) => ({
  dismissed: false,
  dismiss: () => set({ dismissed: true }),
  reset: () => set({ dismissed: false }),
}));
