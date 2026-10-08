const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '..', 'native.js'), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function load(api) {
  const classes = [];
  const window = api ? { __TAURI__: api } : {};
  const context = vm.createContext({
    window,
    document: { documentElement: { classList: { add: value => classes.push(value) } } }
  });
  vm.runInContext(source, context, { filename: 'native.js' });
  return { bridge: window.GrensNative, classes };
}

test('browser context exposes safe fallbacks without native privileges', async () => {
  const { bridge, classes } = load();
  assert.equal(bridge.isNative, false);
  assert.equal(await bridge.copyText('tekst'), false);
  assert.deepEqual(plain(await bridge.saveTextFile('backup.json', '{}')), { handled: false });
  assert.deepEqual(plain(await bridge.openTextFile(1024)), { handled: false });
  assert.deepEqual(classes, []);
});

test('native bridge delegates clipboard and scoped backup dialogs', async () => {
  const calls = [];
  const api = {
    core: {},
    clipboardManager: {
      async writeText(text) { calls.push(['clipboard', text]); }
    },
    dialog: {
      async save(options) { calls.push(['save-dialog', options]); return '/picked/grens.json'; },
      async open(options) { calls.push(['open-dialog', options]); return '/picked/grens.json'; }
    },
    fs: {
      async writeTextFile(path, contents) { calls.push(['write', path, contents]); },
      async stat(path) { calls.push(['stat', path]); return { size: 12 }; },
      async readTextFile(path) { calls.push(['read', path]); return '{"version":1}'; }
    }
  };
  const { bridge, classes } = load(api);
  assert.equal(bridge.isNative, true);
  assert.equal(await bridge.copyText('nee'), true);
  assert.deepEqual(plain(await bridge.saveTextFile('grens.json', '{"ok":true}')), { handled: true, saved: true });
  assert.deepEqual(plain(await bridge.openTextFile(1024)), { handled: true, opened: true, text: '{"version":1}' });
  assert.deepEqual(classes, ['native-app']);
  assert.ok(calls.some(call => call[0] === 'clipboard' && call[1] === 'nee'));
  assert.ok(calls.some(call => call[0] === 'write' && call[1] === '/picked/grens.json'));
  assert.ok(calls.some(call => call[0] === 'open-dialog' && call[1].pickerMode === 'document'));
  assert.ok(calls.some(call => call[0] === 'open-dialog' && call[1].fileAccessMode === 'scoped'));
});

test('native bridge treats cancellation separately and rejects oversized imports', async () => {
  let openPath = null;
  let savePath = null;
  const api = {
    core: {},
    clipboardManager: { async writeText() {} },
    dialog: {
      async save() { return savePath; },
      async open() { return openPath; }
    },
    fs: {
      async writeTextFile() { throw new Error('should not write after cancel'); },
      async stat() { return { size: 2048 }; },
      async readTextFile() { throw new Error('should reject before read'); }
    }
  };
  const { bridge } = load(api);
  assert.deepEqual(plain(await bridge.saveTextFile('grens.json', '{}')), { handled: true, saved: false });
  assert.deepEqual(plain(await bridge.openTextFile(1024)), { handled: true, opened: false });
  openPath = '/picked/large.json';
  await assert.rejects(bridge.openTextFile(1024), /too-large/);
});
