import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAndroidSigning } from './check-android-signing.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expectedVersion = '1.0.0';
const expectedIdentifier = 'nl.wintrip.grens';
const releaseMode = process.argv.includes('--release');
const results = [];

class CheckError extends Error {}

function assert(condition, message) {
  if (!condition) {
    throw new CheckError(message);
  }
}

async function readText(relativePath) {
  try {
    return await readFile(resolve(root, relativePath), 'utf8');
  } catch (error) {
    throw new CheckError(`${relativePath}: ${error.code || error.message}`);
  }
}

async function readJson(relativePath) {
  const source = await readText(relativePath);
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new CheckError(`${relativePath}: ongeldige JSON (${error.message})`);
  }
}

async function check(label, callback) {
  try {
    await callback();
    results.push({ label, passed: true });
    console.log(`PASS ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ label, passed: false });
    console.error(`FAIL ${label}: ${message}`);
  }
}

function cargoPackageVersion(source) {
  const packageHeader = /^\s*\[package\]\s*(?:#.*)?$/m.exec(source);
  assert(packageHeader, 'Cargo.toml mist een [package]-sectie');
  const afterHeader = source.slice(packageHeader.index + packageHeader[0].length);
  const nextSection = afterHeader.search(/^\s*\[[^\]]+\]\s*(?:#.*)?$/m);
  const packageSection = nextSection === -1 ? afterHeader : afterHeader.slice(0, nextSection);
  const version = packageSection.match(/^\s*version\s*=\s*["']([^"']+)["']\s*(?:#.*)?$/m)?.[1];
  assert(version, 'Cargo.toml mist een letterlijke package.version');
  return version;
}

function parseDottedVersion(value, label) {
  assert(typeof value === 'string' || typeof value === 'number', `${label} moet een versie zijn`);
  const text = String(value);
  assert(/^\d+(?:\.\d+)*$/.test(text), `${label} heeft ongeldig formaat: ${text}`);
  return text.split('.').map(Number);
}

function versionAtLeast(value, minimum, label) {
  const actualParts = parseDottedVersion(value, label);
  const minimumParts = parseDottedVersion(minimum, 'minimumversie');
  const length = Math.max(actualParts.length, minimumParts.length);
  for (let index = 0; index < length; index += 1) {
    const actual = actualParts[index] || 0;
    const required = minimumParts[index] || 0;
    if (actual !== required) {
      return actual > required;
    }
  }
  return true;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function plistBoolean(source, key) {
  const pattern = new RegExp(
    `<key>\\s*${escapeRegExp(key)}\\s*<\\/key>\\s*<(true|false)\\s*\\/>`,
    'g',
  );
  const matches = [...source.matchAll(pattern)];
  assert(matches.length === 1, `${key} moet exact eenmaal als boolean voorkomen`);
  return matches[0][1] === 'true';
}

function plistArrayBody(source, key) {
  const pattern = new RegExp(
    `<key>\\s*${escapeRegExp(key)}\\s*<\\/key>\\s*<array(?:\\s*\\/>|\\s*>([\\s\\S]*?)<\\/array\\s*>)`,
    'g',
  );
  const matches = [...source.matchAll(pattern)];
  assert(matches.length === 1, `${key} moet exact eenmaal als array voorkomen`);
  return matches[0][1] || '';
}

function codePointLength(value) {
  return [...value].length;
}

async function readPngDetails(relativePath) {
  const data = await readFile(resolve(root, relativePath));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert(data.length >= 26 && data.subarray(0, 8).equals(signature), `${relativePath}: geen geldige PNG-header`);
  assert(data.subarray(12, 16).toString('ascii') === 'IHDR', `${relativePath}: IHDR ontbreekt`);
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data[25],
  };
}

function validateMetadata(metadata, relativePath) {
  assert(metadata && typeof metadata === 'object' && !Array.isArray(metadata), `${relativePath}: root moet een object zijn`);
  const limits = {
    name: 30,
    subtitle: 30,
    shortDescription: 80,
    fullDescription: 4000,
    keywords: 100,
  };

  for (const [field, maximum] of Object.entries(limits)) {
    const value = metadata[field];
    assert(typeof value === 'string' && value.trim(), `${relativePath}: ${field} moet niet-lege tekst zijn`);
    const length = codePointLength(value);
    assert(length <= maximum, `${relativePath}: ${field} is ${length}/${maximum} tekens`);
  }
}

await check('versies 1.0.0', async () => {
  const [packageJson, tauriConfig, cargoToml] = await Promise.all([
    readJson('package.json'),
    readJson('src-tauri/tauri.conf.json'),
    readText('src-tauri/Cargo.toml'),
  ]);
  const versions = {
    package: packageJson.version,
    tauri: tauriConfig.version,
    cargo: cargoPackageVersion(cargoToml),
  };
  for (const [source, version] of Object.entries(versions)) {
    assert(version === expectedVersion, `${source} version is ${String(version)}, verwacht ${expectedVersion}`);
  }
});

await check('app-identiteit en frontend', async () => {
  const config = await readJson('src-tauri/tauri.conf.json');
  assert(config.identifier === expectedIdentifier, `identifier is ${String(config.identifier)}`);
  assert(config.build?.frontendDist === '../dist', `frontendDist is ${String(config.build?.frontendDist)}`);
  assert(config.app?.withGlobalTauri === true, 'withGlobalTauri moet true zijn');
});

await check('CSP zonder externe HTTP(S)', async () => {
  const config = await readJson('src-tauri/tauri.conf.json');
  const csp = config.app?.security?.csp;
  assert(typeof csp === 'string' && csp.trim(), 'app.security.csp ontbreekt');

  const tokens = csp.split(/[;\s]+/).filter(Boolean);
  for (const token of tokens) {
    const unquoted = token.replace(/^['"]|['"]$/g, '');
    if (/^https?:$/i.test(unquoted)) {
      throw new CheckError(`brede externe bron toegestaan: ${token}`);
    }
    if (/^https?:\/\//i.test(unquoted)) {
      let url;
      try {
        url = new URL(unquoted);
      } catch {
        throw new CheckError(`ongeldige HTTP(S)-bron: ${token}`);
      }
      const isIpcLocalhost =
        url.hostname === 'ipc.localhost'
        && !url.username
        && !url.password
        && !url.port
        && url.pathname === '/'
        && !url.search
        && !url.hash;
      assert(isIpcLocalhost, `externe HTTP(S)-bron toegestaan: ${token}`);
    }
  }
});

await check('minimale capabilities', async () => {
  const capability = await readJson('src-tauri/capabilities/default.json');
  const permissions = capability.permissions;
  assert(Array.isArray(permissions), 'permissions moet een array zijn');
  assert(permissions.every((permission) => typeof permission === 'string'), 'alle permissions moeten tekst zijn');

  const required = [
    'core:default',
    'clipboard-manager:allow-write-text',
    'dialog:allow-open',
    'dialog:allow-save',
    'fs:allow-read-text-file',
    'fs:allow-write-text-file',
    'fs:allow-stat',
  ];
  const forbidden = permissions.filter((permission) =>
    /(^|[-_:])(shell|http|process|opener)(?=$|[-_:])/i.test(permission));
  assert(forbidden.length === 0, `verboden rechten: ${forbidden.join(', ')}`);

  const unique = new Set(permissions);
  assert(unique.size === permissions.length, 'permissions bevat duplicaten');
  const missing = required.filter((permission) => !unique.has(permission));
  const unexpected = permissions.filter((permission) => !required.includes(permission));
  assert(missing.length === 0, `ontbrekende rechten: ${missing.join(', ')}`);
  assert(unexpected.length === 0, `niet-minimale rechten: ${unexpected.join(', ')}`);
});

await check('mobiele minimumversies', async () => {
  const config = await readJson('src-tauri/tauri.conf.json');
  const iosMinimum = config.bundle?.iOS?.minimumSystemVersion;
  const androidMinimum = config.bundle?.android?.minSdkVersion;
  assert(versionAtLeast(iosMinimum, '15', 'iOS minimumSystemVersion'), `iOS minimum is ${String(iosMinimum)}, vereist >=15`);
  assert(Number.isInteger(androidMinimum), 'Android minSdkVersion moet een geheel getal zijn');
  assert(androidMinimum >= 24, `Android minSdkVersion is ${androidMinimum}, vereist >=24`);
});

await check('Apple privacy-manifest', async () => {
  const [privacy, config] = await Promise.all([
    readText('src-tauri/PrivacyInfo.xcprivacy'),
    readJson('src-tauri/tauri.conf.json'),
  ]);
  assert(plistBoolean(privacy, 'NSPrivacyTracking') === false, 'NSPrivacyTracking moet false zijn');
  const collectedData = plistArrayBody(privacy, 'NSPrivacyCollectedDataTypes');
  assert(collectedData.trim() === '', 'NSPrivacyCollectedDataTypes moet leeg zijn');

  const fileTimestampEntry = /<key>\s*NSPrivacyAccessedAPIType\s*<\/key>\s*<string>\s*NSPrivacyAccessedAPICategoryFileTimestamp\s*<\/string>([\s\S]*?)(?=<\/dict\s*>)/g;
  const entries = [...privacy.matchAll(fileTimestampEntry)];
  assert(entries.length === 1, 'FileTimestamp API-type moet exact eenmaal voorkomen');
  const reasons = plistArrayBody(entries[0][1], 'NSPrivacyAccessedAPITypeReasons');
  assert(/<string>\s*C617\.1\s*<\/string>/.test(reasons), 'FileTimestamp mist reason C617.1');
  assert(/<string>\s*3B52\.1\s*<\/string>/.test(reasons), 'FileTimestamp mist documentkiezer-reason 3B52.1');

  const genericResources = config.bundle?.resources || [];
  assert(!JSON.stringify(genericResources).includes('PrivacyInfo.xcprivacy'), 'privacy-manifest mag op iOS niet onder de generieke assets-map belanden');
  const macPrivacySource = config.bundle?.macOS?.files?.['Resources/PrivacyInfo.xcprivacy'];
  assert(macPrivacySource === 'PrivacyInfo.xcprivacy', 'macOS privacy-manifest moet naar Contents/Resources');
});

await check('Apple encryptieverklaring', async () => {
  const info = await readText('src-tauri/Info.plist');
  assert(plistBoolean(info, 'ITSAppUsesNonExemptEncryption') === false, 'ITSAppUsesNonExemptEncryption moet false zijn');
});

await check('app- en store-bronbestanden', async () => {
  const requiredFiles = [
    'index.html',
    'main.js',
    'native.js',
    'personal.js',
    'phrases.js',
    'storage.js',
    'styles.css',
    'vite.config.mjs',
    'src-tauri/build.rs',
    'src-tauri/src/lib.rs',
    'src-tauri/src/main.rs',
    'assets/app-icon.svg',
    'docs/screenshot-nl.png',
    'docs/screenshot-en.png',
    'store/assets/feature-graphic.svg',
    'store/assets/feature-graphic-en.svg',
    'store/assets/feature-graphic.png',
    'store/assets/feature-graphic-en.png',
    'store/assets/app-icon-512.png',
    'store/metadata/nl-NL.json',
    'store/metadata/en-US.json',
    'privacy.html',
    'privacy.css',
    'scripts/check-android-signing.mjs',
    'scripts/prepare-android-signing.mjs',
    'scripts/prepare-mobile-projects.mjs',
    'scripts/prepare-apple-store.mjs',
  ];

  const missing = [];
  for (const relativePath of requiredFiles) {
    try {
      const details = await stat(resolve(root, relativePath));
      if (!details.isFile() || details.size === 0) {
        missing.push(relativePath);
      }
    } catch {
      missing.push(relativePath);
    }
  }
  assert(missing.length === 0, `ontbreekt of leeg: ${missing.join(', ')}`);
});

await check('storemetadata en tekstlimieten', async () => {
  for (const relativePath of ['store/metadata/nl-NL.json', 'store/metadata/en-US.json']) {
    validateMetadata(await readJson(relativePath), relativePath);
  }
});

await check('Google Play artwork', async () => {
  const icon = await readPngDetails('store/assets/app-icon-512.png');
  assert(icon.width === 512 && icon.height === 512, `app-icon is ${icon.width}x${icon.height}, verwacht 512x512`);
  assert(icon.colorType === 2, 'app-icon moet een dekkende 24-bit RGB PNG zijn');
  for (const relativePath of ['store/assets/feature-graphic.png', 'store/assets/feature-graphic-en.png']) {
    const graphic = await readPngDetails(relativePath);
    assert(graphic.width === 1024 && graphic.height === 500, `${relativePath} is ${graphic.width}x${graphic.height}, verwacht 1024x500`);
    assert(graphic.colorType === 2, `${relativePath} moet een dekkende 24-bit RGB PNG zijn`);
  }
});

await check('.gitignore voor build en signing', async () => {
  const gitignore = await readText('.gitignore');
  const patterns = gitignore
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('!'))
    .map((line) => line.replace(/^\//, ''));
  const requiredPatterns = [
    'node_modules/',
    'dist/',
    'src-tauri/target/',
    'src-tauri/gen/schemas/',
    'src-tauri/generated/',
    '*.keystore',
    '*.jks',
    '*.p12',
    '*.p8',
    '*.cer',
    '*.mobileprovision',
    '*.provisionprofile',
    'keystore.properties',
  ];
  const missing = requiredPatterns.filter((pattern) => !patterns.includes(pattern));
  assert(missing.length === 0, `onbeschermde patronen: ${missing.join(', ')}`);
  assert(!patterns.includes('src-tauri/gen/'), 'src-tauri/gen/ mag niet volledig genegeerd worden; commit de mobiele projectbron');
});

if (releaseMode) {
  await check('gegenereerd Android releaseproject', async () => {
    const [mainManifest, debugManifest, gradle, signingProperties] = await Promise.all([
      readText('src-tauri/gen/android/app/src/main/AndroidManifest.xml'),
      readText('src-tauri/gen/android/app/src/debug/AndroidManifest.xml'),
      readText('src-tauri/gen/android/app/build.gradle.kts'),
      stat(resolve(root, 'src-tauri/gen/android/keystore.properties')),
    ]);
    assert(!/android\.permission\.INTERNET/.test(mainManifest), 'release-manifest bevat INTERNET');
    assert(!/android\.software\.leanback|LEANBACK_LAUNCHER/.test(mainManifest), 'release-manifest claimt Android TV');
    assert(/android\.permission\.INTERNET/.test(debugManifest), 'debug-manifest mist INTERNET voor de ontwikkelserver');
    const compileSdk = Number(gradle.match(/\bcompileSdk\s*=\s*(\d+)/)?.[1]);
    const targetSdk = Number(gradle.match(/\btargetSdk\s*=\s*(\d+)/)?.[1]);
    assert(Number.isInteger(compileSdk) && compileSdk >= 36, `compileSdk is ${String(compileSdk)}, vereist >=36`);
    assert(Number.isInteger(targetSdk) && targetSdk >= 36, `targetSdk is ${String(targetSdk)}, vereist >=36`);
    assert(/create\("release"\)/.test(gradle), 'Gradle release signingConfig ontbreekt');
    assert(/signingConfig\s*=\s*signingConfigs\.getByName\("release"\)/.test(gradle), 'release buildType gebruikt de signingConfig niet');
    assert(signingProperties.isFile() && signingProperties.size > 0, 'genegeerde keystore.properties ontbreekt of is leeg');
    await checkAndroidSigning(root);
  });

  await check('gegenereerd iPhone releaseproject', async () => {
    const project = await readText('src-tauri/gen/apple/project.yml');
    assert(/- path: \.\.\/\.\.\/PrivacyInfo\.xcprivacy\s*\n\s*buildPhase: resources/.test(project), 'PrivacyInfo.xcprivacy ontbreekt als target-resource');
    assert(/^\s*TARGETED_DEVICE_FAMILY:\s*["']?1["']?\s*$/m.test(project), 'iOS target is niet iPhone-only');
    assert(!/UISupportedInterfaceOrientations~ipad/.test(project), 'iPad-orientaties staan nog in iPhone-only project');
  });
}

const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;
console.log(`TOTAL ${passed}/${results.length} PASS${failed ? `, ${failed} FAIL` : ''}`);
if (!releaseMode) console.log('INFO gebruik pnpm check:release nadat Android- en iOS-projecten zijn gegenereerd');
if (failed > 0) {
  process.exitCode = 1;
}
