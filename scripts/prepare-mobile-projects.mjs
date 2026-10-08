import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function requirePattern(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

export function patchAndroidManifest(source) {
  requirePattern(source, /<manifest\b/, 'AndroidManifest.xml heeft geen manifest-root.');

  let result = source
    .replace(/^\s*<uses-permission\s+android:name="android\.permission\.INTERNET"\s*\/>\s*\n/m, '')
    .replace(/^\s*<!--\s*AndroidTV support\s*-->\s*\n\s*<uses-feature\s+android:name="android\.software\.leanback"[^>]*\/>\s*\n/m, '')
    .replace(/^\s*<!--\s*AndroidTV support\s*-->\s*\n\s*<category\s+android:name="android\.intent\.category\.LEANBACK_LAUNCHER"\s*\/>\s*\n/m, '');

  if (/android\.permission\.INTERNET/.test(result)) {
    throw new Error('INTERNET-recht kon niet veilig uit het Android release-manifest worden verwijderd.');
  }
  if (/android\.software\.leanback|LEANBACK_LAUNCHER/.test(result)) {
    throw new Error('Onbedoelde Android TV-declaratie kon niet veilig worden verwijderd.');
  }
  return result;
}

export function patchAndroidGradle(source) {
  requirePattern(source, /^android\s*\{/m, 'Android app/build.gradle.kts heeft geen android-blok.');
  let result = source;

  if (!result.includes('// Grens release signing')) {
    const androidBlock = 'android {\n';
    const signingSetup = `// Grens release signing: secrets stay in ignored keystore.properties.\nval releaseSigningFile = rootProject.file("keystore.properties")\nval releaseSigningProperties = Properties().apply {\n    if (releaseSigningFile.exists()) {\n        releaseSigningFile.reader(Charsets.UTF_8).use { load(it) }\n    }\n}\ngradle.taskGraph.whenReady {\n    if (allTasks.any { it.name.contains("Release", ignoreCase = true) } && !releaseSigningFile.exists()) {\n        throw GradleException("Release signing ontbreekt: voer pnpm store:android:prepare uit.")\n    }\n}\n\n`;
    if (!result.includes(androidBlock)) {
      throw new Error('Android-blok niet gevonden; release signing is niet automatisch aangepast.');
    }
    result = result.replace(androidBlock, `${signingSetup}${androidBlock}`);

    const buildTypes = '    buildTypes {\n';
    const signingConfig = `    signingConfigs {\n        create("release") {\n            if (releaseSigningFile.exists()) {\n                keyAlias = requireNotNull(releaseSigningProperties.getProperty("keyAlias"))\n                keyPassword = requireNotNull(releaseSigningProperties.getProperty("password"))\n                storeFile = file(requireNotNull(releaseSigningProperties.getProperty("storeFile")))\n                storePassword = requireNotNull(\n                    releaseSigningProperties.getProperty("storePassword")\n                        ?: releaseSigningProperties.getProperty("password")\n                )\n            }\n        }\n    }\n`;
    if (!result.includes(buildTypes)) {
      throw new Error('Android buildTypes-blok niet gevonden; release signing is niet automatisch aangepast.');
    }
    result = result.replace(buildTypes, `${signingConfig}${buildTypes}`);

    const releaseType = '        getByName("release") {\n';
    if (!result.includes(releaseType)) {
      throw new Error('Android release buildType niet gevonden; signingConfig is niet automatisch gekoppeld.');
    }
    result = result.replace(
      releaseType,
      `${releaseType}            signingConfig = signingConfigs.getByName("release")\n`,
    );
  }

  if (!/signingConfig\s*=\s*signingConfigs\.getByName\("release"\)/.test(result)) {
    throw new Error('Android release buildType gebruikt de signingconfiguratie niet.');
  }
  return result;
}

export function patchIosProject(source) {
  requirePattern(source, /^targets:\s*$/m, 'iOS project.yml heeft geen targets-sectie.');

  let result = source;
  if (!result.includes('- path: ../../PrivacyInfo.xcprivacy')) {
    const launchScreen = '      - path: LaunchScreen.storyboard\n';
    if (!result.includes(launchScreen)) {
      throw new Error('LaunchScreen-bron niet gevonden; privacyresource is niet automatisch aangepast.');
    }
    result = result.replace(
      launchScreen,
      `${launchScreen}      - path: ../../PrivacyInfo.xcprivacy\n        buildPhase: resources\n`,
    );
  }

  if (!/^\s*TARGETED_DEVICE_FAMILY:\s*["']?1["']?\s*$/m.test(result)) {
    const bitcode = '        ENABLE_BITCODE: false\n';
    if (!result.includes(bitcode)) {
      throw new Error('iOS targetinstellingen niet gevonden; device family is niet automatisch aangepast.');
    }
    result = result.replace(bitcode, `${bitcode}        TARGETED_DEVICE_FAMILY: "1"\n`);
  }

  result = result.replace(
    /^        UISupportedInterfaceOrientations~ipad:\s*\n(?:          - UIInterfaceOrientation\S+\s*\n)+/m,
    '',
  );

  if (!result.includes('- path: ../../PrivacyInfo.xcprivacy')) {
    throw new Error('PrivacyInfo.xcprivacy ontbreekt als iOS target-resource.');
  }
  if (!/^\s*TARGETED_DEVICE_FAMILY:\s*["']?1["']?\s*$/m.test(result)) {
    throw new Error('iOS target is niet beperkt tot iPhone.');
  }
  if (/UISupportedInterfaceOrientations~ipad/.test(result)) {
    throw new Error('iPad-orientaties zijn nog aanwezig in het iPhone-only project.');
  }
  return result;
}

async function prepareAndroid(root) {
  const manifestPath = resolve(root, 'src-tauri/gen/android/app/src/main/AndroidManifest.xml');
  const debugManifestPath = resolve(root, 'src-tauri/gen/android/app/src/debug/AndroidManifest.xml');
  const gradlePath = resolve(root, 'src-tauri/gen/android/app/build.gradle.kts');
  const [manifest, gradle] = await Promise.all([
    readFile(manifestPath, 'utf8'),
    readFile(gradlePath, 'utf8'),
  ]);
  await writeFile(manifestPath, patchAndroidManifest(manifest));
  await writeFile(gradlePath, patchAndroidGradle(gradle));
  await mkdir(dirname(debugManifestPath), { recursive: true });
  await writeFile(
    debugManifestPath,
    '<?xml version="1.0" encoding="utf-8"?>\n'
      + '<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n'
      + '    <!-- Alleen nodig om tijdens tauri android dev de lokale ontwikkelserver te bereiken. -->\n'
      + '    <uses-permission android:name="android.permission.INTERNET" />\n'
      + '</manifest>\n',
  );
  console.log('Android voorbereid: minimale telefoon/tablet-release met verplichte upload-key signing.');
}

async function prepareIos(root) {
  const projectPath = resolve(root, 'src-tauri/gen/apple/project.yml');
  const project = await readFile(projectPath, 'utf8');
  await writeFile(projectPath, patchIosProject(project));
  console.log('iOS voorbereid: iPhone-only en PrivacyInfo.xcprivacy als root-resource.');
}

async function main() {
  const platform = process.argv[2];
  if (!['android', 'ios', 'all'].includes(platform)) {
    throw new Error('Gebruik: node scripts/prepare-mobile-projects.mjs android|ios|all');
  }
  if (platform === 'android' || platform === 'all') await prepareAndroid(repositoryRoot);
  if (platform === 'ios' || platform === 'all') await prepareIos(repositoryRoot);
}

const invokedDirectly = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`Mobiele projectvoorbereiding mislukt: ${error.message}`);
    process.exitCode = 1;
  });
}
