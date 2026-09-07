import { create } from 'zustand';

import { useAppState } from './use-app-state';

/**
 * What is about to destroy the interview. Only the copy differs - the choice is the same one
 * every time, and phrasing it in terms of the action is what makes it answerable.
 *
 * The last two are the mock report screen's own exits. They were both raised as `clear`, which
 * is the live assistant's word for emptying the panels and means nothing on a screen showing a
 * scored report - the dialog asked about "clearing" something the candidate had never been told
 * was there. A reason per button is what lets each one name the thing it is actually about to
 * do; see `COPY` in save-history-dialog.tsx.
 */
export type SaveHistoryReason =
  | 'clear'
  | 'start'
  | 'close'
  | 'update'
  | 'stop'
  | 'signout'
  | 'mock-done'
  | 'mock-again';

interface SaveHistoryPromptStore {
  /** The action awaiting an answer, or null when nothing is being asked. */
  reason: SaveHistoryReason | null;
  resolve: ((proceed: boolean) => void) | null;

  /** Ask, unconditionally. Resolves true to go ahead with the action, false to abandon it. */
  prompt: (reason: SaveHistoryReason) => Promise<boolean>;
  /** Answer the open prompt and close it. */
  settle: (proceed: boolean) => void;
}

export const useSaveHistoryPrompt = create<SaveHistoryPromptStore>((set, get) => ({
  reason: null,
  resolve: null,

  prompt: (reason) => {
    // A second question arriving over the first abandons it rather than stacking. Leaving the
    // earlier promise unresolved would strand whichever caller is awaiting it - and for the
    // close prompt that caller is the one holding the window open.
    get().resolve?.(false);

    return new Promise<boolean>((resolve) => {
      set({ reason, resolve });
    });
  },

  settle: (proceed) => {
    const { resolve } = get();
    set({ reason: null, resolve: null });
    resolve?.(proceed);
  },
}));

/**
 * Ask before an action that drops the interview, but only when there is one to drop.
 *
 * `hasHistory` is derived in main and is false for the placeholder copy the panels are seeded
 * with, so a freshly launched app starts and clears without a question - which is the state
 * most Start presses happen in, and a confirmation there would be pure friction.
 */
export function useSaveHistoryGuard() {
  const { appState } = useAppState();
  const hasHistory = appState?.hasHistory ?? false;
  // Both subjects, the pair the window-close guard has always fired on. `clearAll()` empties the
  // mock session along with the live one, and the report screen's own two exits discard a report
  // outright, so a guard that only knew about the live transcript let exactly the content the
  // close prompt protects be thrown away by a button.
  //
  // The *unsaved* half of it, which is the question a guard asks. A report the candidate has
  // already exported has nothing left to lose, and asking about it on Done was asking them to
  // save the file they had just saved. `hasMockContent` stays available unchanged for the callers
  // that mean "does a report exist at all" - the two export surfaces.
  const hasMockContent = appState?.hasMockContent ?? false;
  const hasContent = hasHistory || (appState?.hasUnsavedMockContent ?? false);

  const confirmDiscard = async (reason: SaveHistoryReason): Promise<boolean> => {
    if (!hasContent) return true;
    return useSaveHistoryPrompt.getState().prompt(reason);
  };

  return { hasHistory, hasMockContent, confirmDiscard };
}
