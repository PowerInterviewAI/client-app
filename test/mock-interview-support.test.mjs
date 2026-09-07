/**
 * A released client can meet a backend deployment that predates the mock-interview feature -
 * the client and the backend ship on separate schedules, and that gap is the normal state of
 * things for however long the two releases are apart. Before this probe existed, the only way
 * the app found out was to start a session and have the first question fail, which reads to a
 * candidate as a broken app rather than as a feature that is not there yet.
 *
 * The probe is a `GET` against a `POST`-only route, so what it actually distinguishes is
 * "routed" from "not routed": a backend that has the route answers `405` without matching a
 * handler - no auth, no rate-limit spend, no question generated - and one that does not answer
 * `404`. Driven through a fake `globalThis.fetch` rather than by mocking the class, because the
 * thing under test is how a real status maps onto the flag.
 *
 * The direction matters more than the mapping. Only a `404` may ever produce `false`: that is
 * proof the route is absent, whereas an unreachable backend is proof of nothing and must not be
 * recorded as a backend without the feature, because that answer would outlive the outage. The
 * renderer half of the same asymmetry - `null` reads as available, so a slow probe never hides
 * a working feature - is pinned at the bottom against the sources, the way the other renderer
 * checks in this suite are.
 */
import { codeOnly, createChecker, loadMain, readSource } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('mock-interview-support');

  const { MockInterviewApi } = await loadMain('api/mock-interview.js');
  const api = new MockInterviewApi();

  const originalFetch = globalThis.fetch;
  const calls = [];

  /** Answer the next probe with `status`, or throw when it is null (an unreachable backend). */
  const answerWith = (status) => {
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), method: options?.method });
      if (status === null) throw new TypeError('fetch failed');
      return {
        ok: status >= 200 && status < 300,
        status,
        statusText: 'stubbed',
        json: async () => ({}),
      };
    };
  };

  try {
    answerWith(404);
    check('a 404 reports the feature as absent', (await api.probeSupport()) === false);

    // The probe must not spend anything it does not have to. A GET cannot reach the POST handler,
    // so the backend rejects it on the route table before auth or the rate limiter run.
    const probeCall = calls[0];
    check('the probe asks about the question route', probeCall?.url.endsWith('/api/mock-interview/question'));
    check('the probe uses GET, not the route\'s own POST', probeCall?.method === 'GET');

    answerWith(405);
    check('a 405 reports the feature as present', (await api.probeSupport()) === true);

    // Anything that is not a 404 means the path is routed, which is the whole question. A signed
    // -out client probing before login must not read its own 401 as a missing feature.
    answerWith(401);
    check('a 401 still reports the feature as present', (await api.probeSupport()) === true);

    answerWith(500);
    check('a 500 still reports the feature as present', (await api.probeSupport()) === true);

    // The one that has to be null rather than false: a laptop off the network.
    answerWith(null);
    check('an unreachable backend reports unknown, not absent', (await api.probeSupport()) === null);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // The service half: probed on the edge into live so a client that was open across the deploy
  // picks the feature up, and a null answer dropped rather than written over a known one.
  const service = codeOnly(
    readSource(new URL('../src/main/services/health-check.service.ts', import.meta.url))
  );
  check(
    'the probe is driven from the backend loop',
    service.includes('refreshMockInterviewSupport()')
  );
  check(
    'it fires on the transition into live, not on every ping',
    service.includes('if (backendLive && !wasLive)')
  );
  check(
    'an unknown answer is dropped instead of being written to state',
    service.includes('if (supported === null) return;')
  );

  // The renderer half. Both entry points must close on an explicit `false` only - `=== false`
  // rather than a falsy check, which would also catch the `null` that means "not asked yet".
  for (const [label, path] of [
    ['the home hub card', '../src/renderer/pages/home/index.tsx'],
    ['the command palette', '../src/renderer/components/custom/command-palette.tsx'],
  ]) {
    const source = codeOnly(readSource(new URL(path, import.meta.url)));
    check(
      `${label} gates on an explicit false`,
      source.includes("appState?.mockInterviewSupported === false")
    );
    check(`${label} actually consumes the flag`, source.includes('mockUnsupported'));
  }

  return failures;
}
