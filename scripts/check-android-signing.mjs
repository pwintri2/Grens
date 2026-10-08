import { constants } from 'node:fs';
import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');

export function decodePropertyValue(value) {
  let decoded = '';
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character !== '\\') {
      decoded += character;
      continue;
    }
    if (index + 1 >= value.length) {
      throw new Error('Ongeldige afsluitende backslash in signingconfiguratie.');
    }
    const escaped = value[index += 1];
    if (escaped === 't') decoded += '\t';
    else if (escaped === 'r') decoded += '\r';
    else if (escaped === 'n') decoded += '\n';
    else if (escaped === 'f') decoded += '\f';
    else if (escaped === 'u') {
      const hexadecimal = value.slice(index + 1, index + 5);
      if (!/^[\da-fA-F]{4}$/.test(hexadecimal)) {
        throw new Error('Ongeldige Unicode-escape in signingconfiguratie.');
      }
      decoded += String.fromCharCode(Number.parseInt(hexadecimal, 16));
      index += 4;
    } else {
      decoded += escaped;
    }
  }
  return decoded;
}

function encodedProperty(source, key) {
  const prefix = `${key}=`;
  const matches = source.split(/\r?\n/).filter((line) => line.startsWith(prefix));
  if (matches.length !== 1 || matches[0].length === prefix.length) {
    throw new Error(`Android signingconfiguratie mist een unieke, niet-lege ${key}.`);
  }
  return matches[0].slice(prefix.length);
}

export async function checkAndroidSigning(repositoryRoot = root) {
  const propertiesPath = resolve(repositoryRoot, 'src-tauri/gen/android/keystore.properties');
  const gradlePath = resolve(repositoryRoot, 'src-tauri/gen/android/app/build.gradle.kts');
  const source = await readFile(propertiesPath, 'utf8').catch(() => {
    throw new Error('Android signing ontbreekt. Voer eerst pnpm store:android:prepare uit.');
  });
  for (const key of ['keyAlias', 'password']) {
    decodePropertyValue(encodedProperty(source, key));
  }
  const storeFile = decodePropertyValue(encodedProperty(source, 'storeFile'));
  const keystoreDetails = await stat(storeFile).catch(() => {
    throw new Error('De geconfigureerde Android-keystore is niet leesbaar.');
  });
  if (!keystoreDetails.isFile()) {
    throw new Error('De geconfigureerde Android-keystore is niet leesbaar.');
  }
  await access(storeFile, constants.R_OK).catch(() => {
    throw new Error('De geconfigureerde Android-keystore is niet leesbaar.');
  });

  const gradle = await readFile(gradlePath, 'utf8').catch(() => {
    throw new Error('Android Gradle-releaseconfiguratie ontbreekt. Voer pnpm android:init opnieuw uit.');
  });
  if (!gradle.includes('// Grens release signing')
      || !/create\("release"\)/.test(gradle)
      || !/signingConfig\s*=\s*signingConfigs\.getByName\("release"\)/.test(gradle)
      || !/reader\(Charsets\.UTF_8\)/.test(gradle)
      || /^\+/m.test(gradle)) {
    throw new Error('Android Gradle-releaseconfiguratie is niet compleet. Voer pnpm android:init opnieuw uit.');
  }
}

const invokedDirectly = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  checkAndroidSigning().then(() => {
    console.log('Android signingconfiguratie aanwezig; geheime waarden zijn niet weergegeven.');
  }).catch((error) => {
    console.error(`Android signingcontrole mislukt: ${error.message}`);
    process.exitCode = 1;
  });
}
