const assert = require('node:assert/strict');
const { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const test = require('node:test');

test('Android preparation removes release network and accidental TV support', async () => {
  const { patchAndroidGradle, patchAndroidManifest } = await import('../scripts/prepare-mobile-projects.mjs');
  const source = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <!-- AndroidTV support -->
    <uses-feature android:name="android.software.leanback" android:required="false" />
    <application>
      <activity>
        <intent-filter>
          <category android:name="android.intent.category.LAUNCHER" />
          <!-- AndroidTV support -->
          <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
        </intent-filter>
      </activity>
    </application>
</manifest>
`;
  const prepared = patchAndroidManifest(source);
  assert.doesNotMatch(prepared, /android\.permission\.INTERNET/);
  assert.doesNotMatch(prepared, /android\.software\.leanback|LEANBACK_LAUNCHER/);
  assert.match(prepared, /android\.intent\.category\.LAUNCHER/);
  assert.equal(patchAndroidManifest(prepared), prepared, 'transformation should be idempotent');

  const gradle = `import java.util.Properties
android {
    buildTypes {
        getByName("debug") {}
        getByName("release") {
            optimization { enable = true }
        }
    }
}
`;
  const signedGradle = patchAndroidGradle(gradle);
  assert.match(signedGradle, /create\("release"\)/);
  assert.match(signedGradle, /signingConfig = signingConfigs\.getByName\("release"\)/);
  assert.match(signedGradle, /Release signing ontbreekt/);
  assert.match(signedGradle, /reader\(Charsets\.UTF_8\)/);
  assert.doesNotMatch(signedGradle, /^\+/m, 'generated Kotlin lines must not start with patch markers');
  assert.equal(patchAndroidGradle(signedGradle), signedGradle, 'Gradle transformation should be idempotent');
});

test('Android signing properties preserve spaces, tabs, backslashes and Unicode', async () => {
  const { encodePropertyValue } = await import('../scripts/prepare-android-signing.mjs');
  const { decodePropertyValue } = await import('../scripts/check-android-signing.mjs');
  const source = ' C:\\sleutels\tgrens != café.jks ';
  const encoded = encodePropertyValue(source);

  assert.equal(decodePropertyValue(encoded), source);
  assert.match(encoded, /\\ /, 'spaces must be escaped');
  assert.match(encoded, /\\\\/, 'backslashes must be escaped');
  assert.match(encoded, /\\t/, 'tabs must be escaped');
});

test('Android signing preparation is private and checker resolves an escaped keystore path', async (t) => {
  const { patchAndroidGradle } = await import('../scripts/prepare-mobile-projects.mjs');
  const { prepareAndroidSigning } = await import('../scripts/prepare-android-signing.mjs');
  const { checkAndroidSigning } = await import('../scripts/check-android-signing.mjs');
  const root = await mkdtemp(join(tmpdir(), 'grens-android-signing-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const androidRoot = join(root, 'src-tauri', 'gen', 'android');
  const gradleRoot = join(androidRoot, 'app');
  const keystore = join(root, 'sleutels met spatie', 'café.jks');
  const properties = join(androidRoot, 'keystore.properties');
  await mkdir(gradleRoot, { recursive: true });
  await mkdir(join(root, 'sleutels met spatie'), { recursive: true });
  await writeFile(keystore, 'test-keystore');
  await writeFile(
    join(gradleRoot, 'build.gradle.kts'),
    patchAndroidGradle(`import java.util.Properties\nandroid {\n    buildTypes {\n        getByName("release") {\n        }\n    }\n}\n`),
  );
  await writeFile(properties, 'old=contents\n', { mode: 0o644 });
  await chmod(properties, 0o644);

  await prepareAndroidSigning(root, {
    ANDROID_KEYSTORE_PATH: keystore,
    ANDROID_KEY_ALIAS: 'upload key',
    ANDROID_KEY_PASSWORD: 'tab\tand\\slash',
    ANDROID_STORE_PASSWORD: 'store password',
  });
  await checkAndroidSigning(root);

  assert.equal((await stat(properties)).mode & 0o777, 0o600);
  const source = await readFile(properties, 'utf8');
  assert.match(source, /^storeFile=.*\\ .*café\.jks$/m);
});

test('iOS preparation adds root privacy resource and limits the target to iPhone', async () => {
  const { patchIosProject } = await import('../scripts/prepare-mobile-projects.mjs');
  const source = `name: Grens
targets:
  Grens_iOS:
    sources:
      - path: Sources
      - path: LaunchScreen.storyboard
    info:
      properties:
        UISupportedInterfaceOrientations~ipad:
          - UIInterfaceOrientationPortrait
          - UIInterfaceOrientationLandscapeLeft
    settings:
      base:
        ENABLE_BITCODE: false
`;
  const prepared = patchIosProject(source);
  assert.match(prepared, /- path: \.\.\/\.\.\/PrivacyInfo\.xcprivacy\n\s+buildPhase: resources/);
  assert.match(prepared, /TARGETED_DEVICE_FAMILY: "1"/);
  assert.doesNotMatch(prepared, /UISupportedInterfaceOrientations~ipad/);
  assert.equal(patchIosProject(prepared), prepared, 'transformation should be idempotent');
});
