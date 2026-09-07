/**
 * Finishing the first-run wizard against a backend that has no onboarding endpoint.
 *
 * `readsAsOnboarded` already treats an absent `onboarding_completed` as done, so a deployment
 * predating the field never forces the wizard on anyone. The wizard is still reachable on
 * purpose - Configuration offers a re-run - and that left one path with no exit: Finish holds
 * the user in the wizard whenever the write fails, so on that same deployment the write 404s
 * and Finish can never succeed. Skip was the only way out of a screen the user had chosen to
 * open.
 *
 * A 404 therefore counts as written. The flag cannot be recorded on a backend that does not
 * have the endpoint, and that backend reports every account as onboarded regardless, so there
 * is nothing for the write to disagree with.
 *
 * Every other failure must still fail. A 500 or a dropped connection means the endpoint is
 * there and the write genuinely did not land, and swallowing those would let a real failure
 * read as a completed setup until the next pull put the wizard back.
 */
import { createChecker, loadMain } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('onboarding-write');

  const { accountService } = await loadMain('services/account.service.js');
  const { appStateService } = await loadMain('services/app-state.service.js');
  const windowControl = await loadMain('services/window-control.service.js');

  windowControl.setWindowReference({ isDestroyed: () => true, webContents: { send: () => {} } });

  let reply = async () => ({ status: 200, data: { onboarding_completed: true } });
  accountService.client = { updateOnboarding: () => reply() };

  const setFlag = (value) => appStateService.updateState({ onboardingCompleted: value });

  // The endpoint is missing entirely: the case this exists for.
  setFlag(false);
  reply = async () => ({
    status: 404,
    error: { code: 'HTTP_ERROR', message: 'Not Found' },
  });
  let result = await accountService.setOnboardingCompleted(true);
  check('a 404 reports the setup as saved', result.success === true);
  check(
    'and the flag still reaches app state, so Finish can leave',
    appStateService.getState().onboardingCompleted === true
  );

  // The endpoint is there and the write really failed.
  setFlag(false);
  reply = async () => ({
    status: 500,
    error: { code: 'HTTP_ERROR', message: 'Internal Server Error' },
  });
  result = await accountService.setOnboardingCompleted(true);
  check('a 500 still reports failure', result.success === false);
  check(
    'and leaves the flag alone',
    appStateService.getState().onboardingCompleted === false
  );

  // A dropped connection, which the api client reports as status 0.
  setFlag(false);
  reply = async () => ({
    status: 0,
    error: { code: 'NETWORK_ERROR', message: 'Network request failed' },
  });
  result = await accountService.setOnboardingCompleted(true);
  check('an unreachable backend still reports failure', result.success === false);
  check(
    'and leaves the flag alone too',
    appStateService.getState().onboardingCompleted === false
  );

  // The ordinary path, unchanged.
  setFlag(false);
  reply = async () => ({ status: 200, data: { onboarding_completed: true } });
  result = await accountService.setOnboardingCompleted(true);
  check('a 200 reports the setup as saved', result.success === true);
  check(
    'and records it',
    appStateService.getState().onboardingCompleted === true
  );

  return failures;
}
