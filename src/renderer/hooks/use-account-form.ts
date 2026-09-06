import { useCallback, useEffect, useRef, useState } from 'react';

import { getElectron } from '@/lib/utils';

/**
 * The account's interview identity - full name, profile (CV) and job context - loaded from main
 * and saved back as one unit.
 *
 * Shared by the account page and the first-run wizard, which collect exactly the same three
 * fields and write them through the same `account.update`. The wizard splits them across two
 * steps, so it needs the state to outlive each step's own component; keeping the state here also
 * means neither surface can drift from the other on what counts as valid or what gets trimmed.
 */
export function useAccountForm() {
  const [fullName, setFullName] = useState('');
  const [profileData, setProfileData] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Only true once the fetch actually succeeds. A late failure that left this true would let Save
  // overwrite a perfectly good saved profile with the empty form the user is looking at.
  const [loaded, setLoaded] = useState(false);

  /**
   * Set the moment the user changes any field, and never cleared.
   *
   * A fetch that resolves after the user has started typing must not overwrite what they typed.
   * That is not a theoretical race: the account request runs to 30 seconds, both surfaces render
   * their fields immediately, and on a slow connection the natural thing to do while a form looks
   * empty is to start filling it in. The fields are also disabled while `loading`, which closes
   * the same hole from the other side; this guard is what holds if a caller renders them anyway.
   */
  const edited = useRef(false);

  const markEdited = <T,>(set: (value: T) => void) => {
    return (value: T) => {
      edited.current = true;
      set(value);
    };
  };

  // Loaded straight from main rather than from the tracked app state: that carries only a summary
  // (`InterviewConfigSummary`), and this also picks up what another device may have changed.
  const load = useCallback(async (signal: { cancelled: boolean }) => {
    setLoading(true);
    setLoaded(false);

    try {
      const result = await getElectron()?.account?.get();
      if (signal.cancelled) return;

      if (result?.data && !edited.current) {
        setFullName(result.data.fullName);
        setProfileData(result.data.profileData);
        setContext(result.data.context);
      }
      setLoaded(result?.success ?? false);
    } catch (error) {
      console.error('Failed to load your account details:', error);
      if (!signal.cancelled) setLoaded(false);
    } finally {
      if (!signal.cancelled) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    void load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  /**
   * Try the account fetch again after it failed.
   *
   * Worth a control rather than only a page reload: the fetch fails on a blip, and the surfaces
   * that show it - the account page, and the wizard's first step - are both places the user is
   * sitting still with something to type and no other way forward.
   */
  const reload = useCallback(() => {
    void load({ cancelled: false });
  }, [load]);

  /** Whether there is enough here to run an interview. Mirrors `checkCanStart`'s two checks. */
  const isComplete = fullName.trim() !== '' && profileData.trim() !== '';

  /**
   * Persist all three fields. Throws on failure so each caller can decide what to do next - the
   * account page reports it and stays put, the wizard reports it and does not advance.
   *
   * Trimmed on the way out, not merely validated: `isComplete` already rejects a name of pure
   * whitespace, but a name with a trailing space would otherwise be saved as-is, and it is the
   * string the prompts address the candidate by. The same goes for a CV pasted with a leading
   * blank line.
   */
  const save = useCallback(async () => {
    setSaving(true);
    try {
      const electron = getElectron();
      if (!electron?.account) {
        throw new Error('Electron API not available');
      }

      const result = await electron.account.update(
        fullName.trim(),
        profileData.trim(),
        context.trim()
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to save your account details');
      }
    } finally {
      setSaving(false);
    }
  }, [fullName, profileData, context]);

  return {
    fullName,
    setFullName: markEdited(setFullName),
    profileData,
    setProfileData: markEdited(setProfileData),
    context,
    setContext: markEdited(setContext),
    loading,
    loaded,
    saving,
    isComplete,
    reload,
    save,
  };
}

export type AccountForm = ReturnType<typeof useAccountForm>;
