// Generates the Tauri updater manifest (latest.json) from the signed bundles
// produced by `createUpdaterArtifacts`, then uploads it to the GitHub release.
//
// The updater endpoint in tauri.conf.json points at this file. For each platform
// it needs the signed artifact URL and the contents of the matching `.sig` file.
//
// Env: TAG (e.g. v1.5.2), VERSION (e.g. 1.5.2), GH_TOKEN (for `gh`).

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const { TAG, VERSION } = process.env;
if (!TAG || !VERSION) {
  console.error('TAG and VERSION env vars are required');
  process.exit(1);
}

// 1. Map uploaded asset name -> browser download URL.
//    GitHub stores asset names with spaces replaced by dots, so we match both forms.
const assets = JSON.parse(
  execFileSync('gh', ['release', 'view', TAG, '--json', 'assets'], { encoding: 'utf8' })
).assets ?? [];
const urlByName = new Map(assets.map((a) => [a.name, a.url]));

function resolveUrl(localBasename) {
  return urlByName.get(localBasename) ?? urlByName.get(localBasename.replace(/ /g, '.')) ?? null;
}

// 2. Find every `.sig` file across the downloaded build artifacts.
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
const sigFiles = walk('release-artifacts').filter((f) => f.endsWith('.sig'));

// 3. Map each updater artifact to its Tauri platform key(s).
const platforms = {};
for (const sig of sigFiles) {
  const artifact = basename(sig.slice(0, -4)); // strip ".sig"
  let keys = null;
  if (artifact.endsWith('-setup.exe')) {
    keys = ['windows-x86_64']; // NSIS installer
  } else if (artifact.endsWith('.app.tar.gz')) {
    // macOS updater bundle. A universal binary has no arch in its name and reports
    // its *running* arch at runtime, so it must serve both darwin keys. An explicit
    // arch in the name (a dedicated single-arch build) maps to just that key.
    if (/x86_64|x64/.test(artifact)) keys = ['darwin-x86_64'];
    else if (/aarch64|arm64/.test(artifact)) keys = ['darwin-aarch64'];
    else keys = ['darwin-aarch64', 'darwin-x86_64']; // universal
  } else {
    continue; // ignore non-updater signatures (.msi, .dmg, etc.)
  }

  const url = resolveUrl(artifact);
  if (!url) {
    console.warn(`No uploaded asset URL for "${artifact}" — skipping ${keys.join(', ')}`);
    continue;
  }
  const entry = { signature: readFileSync(sig, 'utf8').trim(), url };
  for (const key of keys) platforms[key] = entry;
}

if (Object.keys(platforms).length === 0) {
  console.error('No updater platforms resolved — is createUpdaterArtifacts enabled and signing configured?');
  process.exit(1);
}

// 4. Write and upload the manifest.
const manifest = {
  version: VERSION,
  pub_date: new Date().toISOString(),
  notes: `Release ${TAG}`,
  platforms,
};
writeFileSync('latest.json', JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));

execFileSync('gh', ['release', 'upload', TAG, 'latest.json', '--clobber'], { stdio: 'inherit' });
console.log('Uploaded latest.json');
