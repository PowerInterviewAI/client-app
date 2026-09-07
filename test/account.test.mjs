/**
 * Three silent data-loss paths in the account sync.
 *
 * All only bite when a pull fails, stalls, or a second account signs in, so nothing surfaces in
 * normal use: the dialog would enable Save over a copy it failed to refresh (overwriting a newer
 * config saved on another device), a pull for one account would delete another account's
 * not-yet-migrated CV off a shared machine, and a slow startup pull would revert a save made
 * while it was still in flight.
 */
import { createChecker, loadMain } from './helpers.mjs';

const account = (id, config) => ({
  data: {
    _id: id,
    username: 'jane',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    credits: 0,
    interview_config: config,
    created_at: 0,
    updated_at: null,
  },
});

const CONFIG = { full_name: 'Jane', profile_data: 'SERVER CV', context: 'SERVER JD' };

export async function run() {
  const { check, failures } = createChecker('account.service');

  const store = await loadMain('store/config.store.js');
  const { accountService } = await loadMain('services/account.service.js');
  const { appStateService } = await loadMain('services/app-state.service.js');
  const windowControl = await loadMain('services/window-control.service.js');

  windowControl.setWindowReference({ isDestroyed: () => true, webContents: { send: () => {} } });

  // Stand in for UsersApi. `private` is erased at runtime, so the singleton's client is swappable.
  let getMe = async () => account('account-A', CONFIG);
  accountService.client = {
    getMe: () => getMe(),
    updateInterviewConfig: async () => ({ error: { code: 'NETWORK_ERROR', message: 'offline' } }),
  };

  // A good pull first, so the session has a loaded config to go stale.
  const pulled = await accountService.pullFromBackend();
  check('pull succeeds', pulled.success === true);
  check(
    'pull loads the config',
    appStateService.getState().interviewConfig.profileData === 'SERVER CV'
  );
  check('pull sets the loaded flag', appStateService.getState().interviewConfigLoaded === true);

  // The dialog refresh now fails. The loaded flag deliberately survives (it gates Start), so
  // reporting success off it alone is what would enable Save over a stale copy.
  getMe = async () => ({ error: { code: 'NETWORK_ERROR', message: 'offline' } });
  const editable = await accountService.getEditableConfig();
  check('stale refresh is not reported as loaded', editable.success === false);
  check(
    'stale refresh reports an error',
    typeof editable.error === 'string' && editable.error !== ''
  );
  check('stale refresh still returns values to display', editable.data.profileData === 'SERVER CV');
  check(
    'Start is not blocked by a failed dialog refresh',
    appStateService.getState().interviewConfigLoaded === true
  );

  // A fresh refresh is safe to save over again.
  getMe = async () => account('account-A', CONFIG);
  check(
    'fresh refresh is reported as loaded',
    (await accountService.getEditableConfig()).success === true
  );

  // Ownership: a copy claimed by another account is mid-migration and must outlive this pull.
  store.claimLegacyInterviewConf('account-A');
  getMe = async () => account('account-B', CONFIG);
  await accountService.pullFromBackend();
  check(
    "another account's claim survives the pull",
    store.getLegacyInterviewConfOwner() === 'account-A'
  );

  // The owning account may discard it: its account now carries the config.
  getMe = async () => account('account-A', CONFIG);
  await accountService.pullFromBackend();
  check('the owning account drops the claim', store.getLegacyInterviewConfOwner() === null);

  // HealthCheckService.start() leaves the startup pull unawaited, so it can still be running
  // when the user saves. Applying its response afterwards would put the pre-save config back
  // with nothing to show for it: the dialog is closed, and the suggestion services read the
  // config out of app state, so the rest of the session would run on the old CV.
  let releasePull;
  const stalled = new Promise((resolve) => {
    releasePull = resolve;
  });
  getMe = async () => {
    await stalled;
    return account('account-A', CONFIG); // what the account held before the save
  };
  accountService.client.updateInterviewConfig = async (body) => account('account-A', { ...body });

  const startupPull = accountService.pullFromBackend();
  await accountService.updateConfig('Jane', 'NEWER CV', 'NEWER JD');
  check('the save lands', appStateService.getState().interviewConfig.profileData === 'NEWER CV');

  releasePull();
  const late = await startupPull;
  check(
    'a late startup pull does not revert the save',
    appStateService.getState().interviewConfig.profileData === 'NEWER CV'
  );
  check('the superseded pull still reports success', late.success === true);
  check(
    'the config stays loaded so Start is not blocked',
    appStateService.getState().interviewConfigLoaded === true
  );

  // --- what sign-out has to take with it ---------------------------------------------------
  //
  // Everything the account put into app state is read by something that renders it or decides
  // with it: `accountEmail` is what every "signed in as" shows, and `onboardingCompleted` is what
  // the first-run gate reads. Left standing across a sign-out, the next user on a shared machine
  // is shown the previous user's address and is never offered setup - both silent, and both only
  // reachable by actually signing two people in.
  accountService.client.getMe = async () => ({
    data: {
      ...account('account-A', CONFIG).data,
      email: 'jane@example.com',
      onboarding_completed: true,
    },
  });
  getMe = accountService.client.getMe;
  await accountService.pullFromBackend();

  check(
    'the account email reaches app state',
    appStateService.getState().accountEmail === 'jane@example.com'
  );
  check(
    'so does the onboarding flag',
    appStateService.getState().onboardingCompleted === true
  );

  accountService.clearState();

  check('sign-out drops the account email', appStateService.getState().accountEmail === '');
  check(
    'sign-out drops the onboarding flag',
    appStateService.getState().onboardingCompleted === false
  );
  check(
    'and the profile with them',
    appStateService.getState().interviewConfig.profileData === ''
  );

  // An account that predates the field omits it, which is not the same answer as false: read as
  // false it would put every user of that deployment into a wizard whose only exits write to an
  // endpoint that deployment does not have.
  accountService.client.getMe = async () => account('account-A', CONFIG);
  getMe = accountService.client.getMe;
  await accountService.pullFromBackend();
  check(
    'an absent onboarding flag counts as done',
    appStateService.getState().onboardingCompleted === true
  );

  return failures;
}
