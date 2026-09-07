/**
 * Interview config was moved off local disk to the backend account. Two invariants matter and
 * both fail silently: a leftover pre-sync config must survive ordinary config writes until it
 * has been migrated (otherwise upgrading users lose their CV), and it must never ride along to
 * the renderer in `config:get`.
 */
import fs from 'node:fs';
import path from 'node:path';

import { createChecker, loadMain } from './helpers.mjs';

export async function run(userDataDir) {
  const { check, failures } = createChecker('config.store');
  const configFile = path.join(userDataDir, 'config.json');

  // Seed the file exactly as a pre-sync install would have left it.
  fs.writeFileSync(
    configFile,
    JSON.stringify({
      runtime: {
        language: 'en',
        email: 'a@b.c',
        autoScrollTranscript: false,
        interviewConf: { username: 'Jane', profileData: 'MY CV', jobDescription: 'MY JD' },
        // Leftover from the removed bring-your-own-API-key feature. Seeded here, never written
        // by anything in this test, to pin that the scrub IIFE at import time actually removes
        // it rather than merely that RuntimeConfig no longer declares the field.
        llmConf: { provider: 'openai', apikey: 'sk-leftover-secret', model: 'gpt-4o' },
        // Leftover from the retired "don't show again" headphone notice preference - same scrub
        // mechanism (scrubRetiredKey), a different retired key.
        headphoneNoticeAcknowledged: true,
        // Backed the control bar's split Start button, which no longer exists. Seeded so the
        // scrub below has something to remove on an upgrading install.
        lastSessionMode: 'live',
        // Recorded whether the first-run wizard had run on this machine. It lives on the account
        // now, so the local copy has to go: two answers to a one-answer question is how the
        // wizard ends up deciding by whichever was read last.
        onboardingCompleted: true,
        // The pre-rename name for `hintOnlyMode`, set to the mode this install was left on.
        // Both mechanisms that touch it are exercised below: the migration reads it once to
        // carry the choice across, then scrubRetiredKey removes it.
        professionalMode: false,
      },
    })
  );

  const store = await loadMain('store/config.store.js');

  check(
    'legacy conf is readable for migration',
    store.getLegacyInterviewConf()?.profileData === 'MY CV'
  );

  const cfg = store.configStore.getConfig();
  check('getConfig omits interviewConf', !('interviewConf' in cfg));
  check(
    'getConfig keeps real settings',
    cfg.email === 'a@b.c' && cfg.autoScrollTranscript === false
  );

  // The data-loss trap: an unrelated write must not drop the not-yet-migrated copy.
  store.configStore.updateConfig({ sessionToken: 'tok' });
  const afterWrite = store.configStore.getStoredRuntime();
  check('interviewConf survives updateConfig', afterWrite?.interviewConf?.profileData === 'MY CV');
  check('updateConfig applied the change', afterWrite?.sessionToken === 'tok');
  check('updateConfig preserved untouched keys', afterWrite?.autoScrollTranscript === false);

  // The claim must outlive a restart, or a second user signing in first inherits the CV.
  check('no owner before claim', store.getLegacyInterviewConfOwner() === null);
  store.claimLegacyInterviewConf('account-A');
  check('owner claim readable', store.getLegacyInterviewConfOwner() === 'account-A');
  check(
    'owner claim persisted to disk',
    JSON.parse(fs.readFileSync(configFile, 'utf8')).legacyInterviewConfOwner === 'account-A'
  );

  store.clearLegacyInterviewConf();
  check('clear drops the in-memory copy', store.getLegacyInterviewConf() === null);
  check(
    'clear drops the disk copy',
    !('interviewConf' in (store.configStore.getStoredRuntime() ?? {}))
  );
  check('clear drops the owner claim', store.getLegacyInterviewConfOwner() === null);
  check('clear leaves other settings intact', store.configStore.getConfig().email === 'a@b.c');

  // Hint-only is the default for a new install, but an upgrading one keeps the mode it was
  // already on. The seed above was left on full sentences (`professionalMode: false`), so the
  // renamed key must read false here rather than picking up the new default - otherwise the
  // rename silently changes what every existing user sees in the panel.
  check('the renamed mode carries the upgrading choice across', cfg.hintOnlyMode === false);
  check(
    'and the pre-rename key is scrubbed',
    !('professionalMode' in (store.configStore.getStoredRuntime() ?? {}))
  );


  store.configStore.updateConfig({ hintOnlyMode: true });
  check('hintOnlyMode is persisted', store.configStore.getStoredRuntime()?.hintOnlyMode === true);

  store.configStore.updateConfig({ sessionToken: 'tok2' });
  check(
    'hintOnlyMode survives an unrelated write',
    store.configStore.getConfig().hintOnlyMode === true
  );

  // `lastSessionMode` backed the control bar's split Start button, which no longer exists.
  // Seeded above, so this pins the scrub rather than merely that RuntimeConfig stopped declaring
  // it - every read and write in the store spreads the raw stored object through, and nothing
  // else strips a key TypeScript has forgotten about.
  check(
    'the retired lastSessionMode is scrubbed',
    !('lastSessionMode' in (store.configStore.getStoredRuntime() ?? {}))
  );
  check(
    'the retired local onboardingCompleted is scrubbed',
    !('onboardingCompleted' in (store.configStore.getStoredRuntime() ?? {}))
  );

  // Security cleanup: llmConf could hold a real provider API key in plaintext. Removing the
  // field from RuntimeConfig does not erase it from an existing install's disk - the scrub IIFE
  // at the bottom of the store has to actually delete it, and the write has to reach the file,
  // not just the in-memory store, or the key survives the next getConfig/updateConfig spread.
  check(
    'a pre-upgrade install with a stored llmConf has it scrubbed on load',
    !('llmConf' in (store.configStore.getStoredRuntime() ?? {}))
  );
  check(
    'the scrub is written back to disk, not just held in memory',
    !('llmConf' in (JSON.parse(fs.readFileSync(configFile, 'utf8')).runtime ?? {}))
  );

  // Same scrub, a second retired key - not sensitive like llmConf, but nothing else will ever
  // remove it either, so it would otherwise sit on disk forever on an upgraded install.
  check(
    'a pre-upgrade install with a stored headphoneNoticeAcknowledged has it scrubbed on load',
    !('headphoneNoticeAcknowledged' in (store.configStore.getStoredRuntime() ?? {}))
  );

  return failures;
}
