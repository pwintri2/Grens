import { access, chmod, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const generated = resolve(root, 'src-tauri/generated');
const teamId = process.env.APPLE_TEAM_ID || '';
const appIdPrefix = process.env.APPLE_APP_ID_PREFIX || teamId;
const profileInput = process.env.MACOS_PROVISIONING_PROFILE || '';

if (!/^[A-Z0-9]{10}$/.test(teamId)) {
  throw new Error('APPLE_TEAM_ID moet de Apple Team ID van 10 hoofdletters/cijfers zijn.');
}
if (!/^[A-Z0-9]{10}$/.test(appIdPrefix)) {
  throw new Error('APPLE_APP_ID_PREFIX moet uit 10 hoofdletters/cijfers bestaan.');
}
if (!profileInput) {
  throw new Error('MACOS_PROVISIONING_PROFILE moet naar een Mac App Store Connect-profiel wijzen.');
}

const profile = isAbsolute(profileInput) ? profileInput : resolve(root, profileInput);
await access(profile);
await mkdir(generated, { recursive: true });

const entitlementsTemplate = await readFile(resolve(root, 'src-tauri/templates/Entitlements.plist.template'), 'utf8');
const entitlements = entitlementsTemplate
  .replaceAll('__APPLE_TEAM_ID__', teamId)
  .replaceAll('__APPLE_APP_ID_PREFIX__', appIdPrefix);
const entitlementsPath = resolve(generated, 'Entitlements.plist');
const embeddedProfilePath = resolve(generated, 'embedded.provisionprofile');
await writeFile(entitlementsPath, entitlements, { mode: 0o600 });
await copyFile(profile, embeddedProfilePath);
await Promise.all([
  chmod(entitlementsPath, 0o600),
  chmod(embeddedProfilePath, 0o600),
]);

const config = {
  bundle: {
    macOS: {
      entitlements: './generated/Entitlements.plist',
      files: {
        'Resources/PrivacyInfo.xcprivacy': './PrivacyInfo.xcprivacy',
        'embedded.provisionprofile': './generated/embedded.provisionprofile'
      }
    }
  }
};
const configPath = resolve(generated, 'tauri.appstore.conf.json');
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
await chmod(configPath, 0o600);
console.log('Apple Store-configuratie staat in src-tauri/generated/ (genegeerd door Git).');
