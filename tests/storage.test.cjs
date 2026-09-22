'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '..', 'storage.js'), 'utf8');
const keys = {custom: 'neezegger.custom.v1', schedule: 'neezegger.schedule.v1', dailyLog: 'neezegger.daily-log.v1'};
const plain = value => JSON.parse(JSON.stringify(value));
const phrase = (id = 'a', text = 'Ik heb vandaag geen ruimte.') => ({id, text, category: 'werk', tone: 'warm', favorite: false});
const moment = (id = 'm', phraseId = null) => ({id, time: '08:00', title: 'Ochtend', text: 'Even stilstaan.', days: [5, 1, 3], enabled: true, phraseId});
const pack = (custom = [], schedule = []) => JSON.stringify({app: 'Grens', version: 1, custom, schedule});

function setup(initial = {}) {
  const values = new Map(Object.entries(initial));
  const operations = [];
  let interceptor;
  const storage = {
    getItem(key) { operations.push(['get', key]); return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { operations.push(['set', key]); if (interceptor) interceptor(key, value); values.set(key, value); },
    removeItem(key) { operations.push(['remove', key]); values.delete(key); }
  };
  function reload() {
    const context = {window: {localStorage: storage}, Uint32Array};
    vm.runInNewContext(source, context);
    return context.window.GrensStore;
  }
  return {store: reload(), reload, values, operations, intercept(fn) { interceptor = fn; }};
}

test('reload preserves custom phrases, explicit empty schedule and per-date progress without accessing legacy keys', () => {
  const env = setup({'neezegger.saved.v1': '[{"original":"untouched"}]', 'neezegger.lang.v1': 'en'});
  assert.deepEqual(plain(env.store.load().missing), ['custom', 'schedule', 'dailyLog']);
  const items = [phrase()];
  const log = {'2026-09-13': ['m'], '2026-09-14': []};
  assert.equal(env.store.saveMany({custom: items, schedule: [], dailyLog: log}).ok, true);
  const loaded = env.reload().load();
  assert.deepEqual(plain(loaded.custom), items);
  assert.deepEqual(plain(loaded.dailyLog), log);
  assert.deepEqual(plain(loaded.schedule), []);
  assert.deepEqual(plain(loaded.missing), []);
  assert.ok(env.operations.every(([, key]) => Object.values(keys).includes(key)));
  assert.equal(env.values.get('neezegger.saved.v1'), '[{"original":"untouched"}]');
  assert.equal(env.values.get('neezegger.lang.v1'), 'en');
});

test('invalid and future storage is blocked and left byte-for-byte intact', () => {
  for (const raw of ['{broken', '{"version":2,"items":[]}', '{"version":1,"items":[{"id":"broken"}]}', '']) {
    const env = setup({[keys.custom]: raw});
    assert.deepEqual(plain(env.store.load().blocked), ['custom']);
    assert.equal(env.store.save('custom', [phrase()]).ok, false);
    assert.equal(env.values.get(keys.custom), raw);
  }
});

test('validation retains XSS-like text literally and rejects unsafe fields and limits', () => {
  const store = setup().store;
  const xss = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  assert.equal(store.validateCustom(phrase('__proto__', xss)).text, xss);
  for (const item of [phrase('a', 'a'.repeat(501)), {...phrase(), category: '__proto__'}, {...phrase(), favorite: 'true'}, {...phrase(), id: '<bad>'}]) {
    assert.equal(store.validateCustom(item), null);
  }
  for (const item of [{...moment(), time: '24:00'}, {...moment(), days: []}, {...moment(), days: [1, 1]}, {...moment(), days: [7]}, {...moment(), title: 'x'.repeat(101)}, {...moment(), text: ''}]) {
    assert.equal(store.validateSchedule(item), null);
  }
  assert.deepEqual(plain(store.validateSchedule(moment()).days), [1, 3, 5]);
  assert.equal(store.save('dailyLog', {'2026-02-30': ['m']}).error, 'invalid-data');
  assert.equal(store.save('dailyLog', JSON.parse('{"__proto__":["m"]}')).error, 'invalid-data');
});

test('import deduplicates content, preserves favorites and remaps conflicting phrase and schedule IDs', () => {
  const store = setup().store;
  const existing = [phrase('a', 'Original'), phrase('duplicate', 'Same')];
  const existingSchedule = [moment('m')];
  const importedCustom = [phrase('a', 'New'), {...phrase('incoming-same', 'Same'), favorite: true}];
  const importedSchedule = [{...moment('m', 'a'), title: 'New moment'}, {...moment('other', 'incoming-same'), title: 'Same phrase'}];
  const result = store.importData(pack(importedCustom, importedSchedule), existing, existingSchedule);
  assert.equal(result.addedCustom, 1);
  assert.equal(result.addedSchedule, 2);
  const added = result.custom.find(item => item.text === 'New');
  assert.notEqual(added.id, 'a');
  const linked = result.schedule.find(item => item.title === 'New moment');
  assert.equal(linked.phraseId, added.id);
  assert.equal(linked.text, 'New');
  assert.notEqual(linked.id, 'm');
  assert.equal(result.custom.find(item => item.id === 'duplicate').favorite, true);
  assert.equal(result.schedule.find(item => item.title === 'Same phrase').phraseId, 'duplicate');
  assert.equal(existing[1].favorite, false, 'inputs are not mutated');
  const repeat = store.importData(pack(importedCustom, importedSchedule), result.custom, result.schedule);
  assert.equal(repeat.addedCustom, 0);
  assert.equal(repeat.addedSchedule, 0);
});

test('export/import roundtrip; invalid import is all-or-nothing, size and count capped', () => {
  const store = setup().store;
  const original = [phrase()];
  const schedule = [{...moment(), days: [1, 3, 5]}];
  const roundtrip = store.importData(store.exportData(original, schedule), [], []);
  assert.deepEqual(plain(roundtrip.custom), original);
  assert.deepEqual(plain(roundtrip.schedule), schedule);
  for (const json of ['{broken', JSON.stringify({app: 'Grens', version: 2, custom: [], schedule: []}), pack([phrase(), {...phrase('invalid'), tone: 'bad'}]), pack([phrase(), phrase('a', 'conflicting')]), pack(Array.from({length: 1001}, (_, i) => phrase('a' + i))), ' '.repeat(1024 * 1024 + 1)]) {
    assert.throws(() => store.importData(json, original, schedule));
    assert.equal(original.length, 1);
    assert.equal(schedule.length, 1);
  }
  const dangling = store.importData(pack([], [moment('orphan', 'missing')]), [], []);
  assert.equal(dangling.schedule[0].phraseId, null);
  assert.equal(dangling.schedule[0].text, 'Even stilstaan.');
});

test('another tab changing data prevents overwrite and reports a conflict', () => {
  const env = setup();
  env.store.load();
  const other = JSON.stringify({version: 1, items: [phrase('other')]});
  env.values.set(keys.custom, other);
  assert.equal(env.store.save('custom', [phrase()]).error, 'conflict');
  assert.equal(env.values.get(keys.custom), other);
});

test('quota errors roll a multiple-collection import back to the previous storage', () => {
  const env = setup();
  env.store.load();
  const oldCustom = [phrase('old')];
  assert.equal(env.store.save('custom', oldCustom).ok, true);
  const prior = env.values.get(keys.custom);
  env.intercept(key => { if (key === keys.schedule) { const error = new Error('full'); error.name = 'QuotaExceededError'; throw error; } });
  const result = env.store.saveMany({custom: [phrase('new')], schedule: [moment()]});
  assert.equal(result.error, 'quota');
  assert.equal(env.values.get(keys.custom), prior);
  assert.equal(env.values.has(keys.schedule), false);
});

test('a failed rollback explicitly reports partial-write', () => {
  const env = setup();
  env.store.load();
  env.store.save('custom', [phrase('old')]);
  let writes = 0;
  env.intercept(() => { if (++writes >= 2) throw new Error('storage became unavailable'); });
  const result = env.store.saveMany({custom: [phrase('new')], schedule: [moment()]});
  assert.equal(result.error, 'partial-write');
  assert.deepEqual(plain(result.affected), ['custom']);
});

test('default examples are independent, valid and translated', () => {
  const store = setup().store;
  const nl = store.defaults('nl');
  const en = store.defaults('en');
  assert.equal(nl.length, 3);
  assert.ok(nl.every(item => store.validateSchedule(item)));
  assert.notEqual(nl[0].text, en[0].text);
  assert.equal(nl[0].id, en[0].id);
  nl[0].days.pop();
  assert.equal(store.defaults('nl')[0].days.length, 7);
});

test('English and Dutch untouched examples deduplicate across imports', () => {
  const store = setup().store;
  const nl = store.defaults('nl');
  const en = store.defaults('en');
  const merged = store.importData(store.exportData([], en), [], nl);
  assert.equal(merged.addedSchedule, 0);
  assert.equal(merged.schedule.length, 3);
  assert.deepEqual(plain(merged.schedule), plain(nl), 'existing language, IDs and state are retained');
  assert.equal(nl[2].title, 'Avondcheck');
  assert.equal(en[2].title, 'Evening check-in');
  const old = en.map(item => item.exampleKey === 'evening' ? {...item, title: 'Evening reflection'} : item);
  assert.equal(store.importData(pack([], old), [], nl).addedSchedule, 0);
  const otherTime = [{...en[0], time: '09:00'}];
  assert.equal(store.importData(pack([], otherTime), [], nl).addedSchedule, 1, 'different recurrence remains distinct');
});

test('untrusted example markers cannot hide imported custom wording or linked phrases', () => {
  const store = setup().store;
  const original = store.defaults('nl')[0];
  for (const changed of [
    {...original, title: 'Mijn eigen titel'},
    {...original, text: 'Mijn aangepaste tekst.'},
    {...original, phraseId: 'linked'}
  ]) {
    const clean = store.validateSchedule(changed);
    assert.equal(clean.exampleKey, undefined);
    assert.equal(clean.title, changed.title);
    assert.equal(clean.text, changed.text);
  }
  const custom = {...original, title: 'Mijn eigen titel', text: 'Mijn aangepaste tekst.'};
  const merged = store.importData(pack([], [custom]), [], [original]);
  assert.equal(merged.addedSchedule, 1);
  const added = merged.schedule.find(item => item.title === custom.title);
  assert.ok(added);
  assert.equal(added.text, custom.text);
  assert.equal(added.exampleKey, undefined);
  assert.notEqual(added.id, original.id);
  const roundtrip = store.importData(store.exportData([], [custom]), [], []);
  assert.equal(roundtrip.schedule[0].exampleKey, undefined);
  const stored = setup({[keys.schedule]: JSON.stringify({version: 1, items: [custom]})});
  const loaded = stored.store.load();
  assert.equal(loaded.schedule[0].text, custom.text);
  assert.equal(loaded.schedule[0].exampleKey, undefined);
  assert.equal(loaded.blocked.length, 0);
});
