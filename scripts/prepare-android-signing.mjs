import { constants } from 'node:fs';
import { access, chmod, mkdir, stat, writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');

function requireValue(value, name) {
  if (!value || /[\r\n]/.test(value)) throw new Error(`${name} ontbreekt of bevat een regeleinde.`);
}

export function encodePropertyValue(value) {
  return [...value].map((character) => {
    if (character === '\\') return '\\\\';
    if (character === '\t') return '\\t';
    if (character === '\f') return '\\f';
    if (character === ' ') return '\\ ';
    if ('=:#!'.includes(character)) return `\\${character}`;
    return character;
  }).join('');
}

export async function prepareAndroidSigning(repositoryRoot = root, environment = process.env) {
  const androidRoot = resolve(repositoryRoot, 'src-tauri/gen/android');
  const gradleFile = resolve(androidRoot, 'app/build.gradle.kts');
  const propertiesPath = resolve(androidRoot, 'keystore.properties');
  const keystoreInput = environment.ANDROID_KEYSTORE_PATH || '';
  const keyAlias = environment.ANDROID_KEY_ALIAS || '';
  const password = environment.ANDROID_KEY_PASSWORD || '';
  const storePassword = environment.ANDROID_STORE_PASSWORD || password;

  await access(gradleFile).catch(() => {
    throw new Error('Genereer eerst het Android-project met pnpm android:init.');
  });
  requireValue(keystoreInput, 'ANDROID_KEYSTORE_PATH');
  requireValue(keyAlias, 'ANDROID_KEY_ALIAS');
  requireValue(password, 'ANDROID_KEY_PASSWORD');
  requireValue(storePassword, 'ANDROID_STORE_PASSWORD');

  const keystore = isAbsolute(keystoreInput)
    ? keystoreInput
    : resolve(repositoryRoot, keystoreInput);
  const keystoreDetails = await stat(keystore).catch(() => {
    throw new Error('ANDROID_KEYSTORE_PATH wijst niet naar een leesbaar bestand.');
  });
  if (!keystoreDetails.isFile()) {
    throw new Error('ANDROID_KEYSTORE_PATH wijst niet naar een leesbaar bestand.');
  }
  await access(keystore, constants.R_OK).catch(() => {
    throw new Error('ANDROID_KEYSTORE_PATH wijst niet naar een leesbaar bestand.');
  });

  await mkdir(androidRoot, { recursive: true });
  await chmod(propertiesPath, 0o600).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  await writeFile(
    propertiesPath,
    `keyAlias=${encodePropertyValue(keyAlias)}\n`
      + `password=${encodePropertyValue(password)}\n`
      + `storePassword=${encodePropertyValue(storePassword)}\n`
      + `storeFile=${encodePropertyValue(keystore)}\n`,
    { mode: 0o600 },
  );
  await chmod(propertiesPath, 0o600);
}

const invokedDirectly = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  prepareAndroidSigning().then(() => {
    console.log('Android signingconfiguratie staat in het door Git genegeerde keystore.properties.');
  }).catch((error) => {
    console.error(`Android signingvoorbereiding mislukt: ${error.message}`);
    process.exitCode = 1;
  });
}
