/* Grens local storage and portable backups. No backend or dependencies.
 *
 * window.GrensStore:
 *   load() -> {custom, schedule, dailyLog, warnings, blocked, missing}
 *     warnings: [{collection, code}], blocked/missing: collection names.
 *   save(collection, items), saveMany({custom?, schedule?, dailyLog?})
 *     -> {ok:true} or {ok:false, error:code, collection?, affected?}.
 *   id(), validateCustom(item), validateSchedule(item), defaults(lang).
 *   exportData(custom, schedule) -> JSON string.
 *   importData(json, currentCustom, currentSchedule)
 *     -> {custom, schedule, addedCustom, addedSchedule}; throws with .code.
 *
 * Only the three KEYS below are accessed; saved phrases and language are
 * managed by the existing app. Each key holds {version:1, items:...}.
 * Export format: {app:"Grens", version:1, custom:[], schedule:[]}.
 * Daily completions are local YYYY-MM-DD -> schedule-id[] and stay local.
 * Import validates the whole file before merging. IDs may conflict with
 * existing records; duplicate IDs within an import are ambiguous and rejected.
 * Content duplicates keep existing IDs; favorites are preserved with logical OR.
 * Schedule duplicates retain their existing enabled status and reference.
 * Recognized untouched examples deduplicate across languages; markers on edited
 * text or linked phrases are removed, preserving the supplied title and text.
 * A missing phrase reference is detached, preserving the required text snapshot.
 *
 * Invalid/future storage is never overwritten. Writes detect changes since
 * load()/last save. saveMany preflights all writes and rolls back on failure;
 * localStorage has no genuine multi-key/cross-tab transaction. A rollback that
 * itself fails is explicitly reported as partial-write instead of hidden.
 */
(function () {
  'use strict';

  var KEYS = {
    custom: 'neezegger.custom.v1',
    schedule: 'neezegger.schedule.v1',
    dailyLog: 'neezegger.daily-log.v1'
  };
  var COLLECTIONS = Object.keys(KEYS);
  var MAX_ITEMS = 1000;
  var MAX_IMPORT_BYTES = 1024 * 1024;
  var MAX_STORED_BYTES = 4 * 1024 * 1024;
  var EXAMPLES = {
    morning: {time: '08:00', nl: ['Ochtendcheck', 'Wat heb ik vandaag echt nodig?'],
      en: ['Morning check-in', 'What do I really need today?']},
    noon: {time: '12:00', nl: ['Middagcheck', 'Heb ik nog ruimte voor extra verzoeken?'],
      en: ['Midday check-in', 'Do I still have room for extra requests?']},
    evening: {time: '20:00', nl: ['Avondcheck', 'Welke grens heb ik vandaag bewaakt?'],
      en: ['Evening check-in', 'Which boundary did I protect today?'],
      aliases: {nl: 'Avondreflectie', en: 'Evening reflection'}}
  };
  var snapshots = Object.create(null);
  var blocked = Object.create(null);
  var loaded = false;
  var counter = 0;

  function record(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function validId(value) {
    return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
  }

  function cleanText(value, max) {
    return typeof value === 'string' && value.length <= max && value.trim() ? value.trim() : null;
  }

  function utf8Bytes(text) {
    var bytes = 0;
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code < 0x80) bytes++;
      else if (code < 0x800) bytes += 2;
      else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length &&
               text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff) {
        bytes += 4;
        i++;
      } else bytes += 3;
    }
    return bytes;
  }

  function id() {
    counter++;
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        var values = new Uint32Array(2);
        window.crypto.getRandomValues(values);
        return 'g-' + values[0].toString(36) + values[1].toString(36) + '-' + counter.toString(36);
      }
    } catch (error) { /* Local file contexts can have limited crypto support. */ }
    return 'g-' + Date.now().toString(36) + '-' + counter.toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function validateCustom(item) {
    if (!record(item) || !validId(item.id)) return null;
    var text = cleanText(item.text, 500);
    if (!text || ['werk', 'sociaal', 'familie', 'afspraak'].indexOf(item.category) < 0 ||
        ['warm', 'kort', 'duidelijk'].indexOf(item.tone) < 0 || typeof item.favorite !== 'boolean') return null;
    return {id: item.id, text: text, category: item.category, tone: item.tone, favorite: item.favorite};
  }

  function untouchedExample(item, key) {
    var example = EXAMPLES[key];
    if (!example || item.phraseId) return false;
    return ['nl', 'en'].some(function (language) {
      var wording = example[language];
      var knownTitle = item.title === wording[0] || (example.aliases && item.title === example.aliases[language]);
      return knownTitle && item.text === wording[1];
    });
  }

  function validateSchedule(item) {
    if (!record(item) || !validId(item.id)) return null;
    var title = cleanText(item.title, 100);
    var text = cleanText(item.text, 500);
    if (!title || !text || typeof item.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) ||
        !Array.isArray(item.days) || !item.days.length || item.days.length > 7 || typeof item.enabled !== 'boolean') return null;
    var days = [];
    for (var i = 0; i < item.days.length; i++) {
      var day = item.days[i];
      if (!Number.isInteger(day) || day < 0 || day > 6 || days.indexOf(day) !== -1) return null;
      days.push(day);
    }
    if (item.phraseId !== undefined && item.phraseId !== null && !validId(item.phraseId)) return null;
    if (item.exampleKey !== undefined && ['morning', 'noon', 'evening'].indexOf(item.exampleKey) < 0) return null;
    var clean = {id: item.id, time: item.time, title: title, text: text,
      days: days.sort(), enabled: item.enabled, phraseId: item.phraseId || null};
    // An imported marker must never hide user-written text behind a translation.
    if (item.exampleKey !== undefined && untouchedExample(clean, item.exampleKey)) clean.exampleKey = item.exampleKey;
    return clean;
  }

  function validateList(items, validator) {
    if (!Array.isArray(items) || items.length > MAX_ITEMS) return null;
    var seen = Object.create(null);
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var clean = validator(items[i]);
      if (!clean || seen[clean.id]) return null;
      seen[clean.id] = true;
      result.push(clean);
    }
    return result;
  }

  function validateDailyLog(items) {
    if (!record(items)) return null;
    var dates = Object.keys(items);
    if (dates.length > 36500) return null;
    var result = {};
    for (var i = 0; i < dates.length; i++) {
      var date = dates[i];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
      var parsed = new Date(date + 'T12:00:00Z');
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
      var ids = items[date];
      if (!Array.isArray(ids) || ids.length > MAX_ITEMS) return null;
      var seen = Object.create(null);
      var clean = [];
      for (var j = 0; j < ids.length; j++) {
        if (!validId(ids[j]) || seen[ids[j]]) return null;
        seen[ids[j]] = true;
        clean.push(ids[j]);
      }
      result[date] = clean;
    }
    return result;
  }

  function validateCollection(collection, items) {
    if (collection === 'custom') return validateList(items, validateCustom);
    if (collection === 'schedule') return validateList(items, validateSchedule);
    if (collection === 'dailyLog') return validateDailyLog(items);
    return null;
  }

  function decode(collection, raw) {
    if (raw.length > MAX_STORED_BYTES || utf8Bytes(raw) > MAX_STORED_BYTES) return {error: 'corrupt-data'};
    var parsed;
    try { parsed = JSON.parse(raw); } catch (error) { return {error: 'corrupt-data'}; }
    if (!record(parsed)) return {error: 'corrupt-data'};
    if (parsed.version !== 1) return {error: 'unknown-version'};
    var clean = validateCollection(collection, parsed.items);
    return clean === null ? {error: 'corrupt-data'} : {items: clean};
  }

  function load() {
    var result = {custom: [], schedule: [], dailyLog: {}, warnings: [], blocked: [], missing: []};
    snapshots = Object.create(null);
    blocked = Object.create(null);
    COLLECTIONS.forEach(function (collection) {
      try {
        var raw = window.localStorage.getItem(KEYS[collection]);
        snapshots[collection] = raw;
        if (raw === null) {
          result.missing.push(collection);
          return;
        }
        var decoded = decode(collection, raw);
        if (decoded.error) blocked[collection] = decoded.error;
        else result[collection] = decoded.items;
      } catch (error) {
        blocked[collection] = 'unavailable';
      }
      if (blocked[collection]) {
        result.blocked.push(collection);
        result.warnings.push({collection: collection, code: blocked[collection]});
      }
    });
    loaded = true;
    return result;
  }

  function failureCode(error) {
    return error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 || error.code === 1014) ? 'quota' : 'unavailable';
  }

  function saveMany(changes) {
    if (!record(changes)) return {ok: false, error: 'invalid-data'};
    var collections = Object.keys(changes);
    if (!collections.length || collections.some(function (name) { return COLLECTIONS.indexOf(name) < 0; })) {
      return {ok: false, error: 'invalid-data'};
    }
    if (!loaded) load();
    var encoded = Object.create(null);
    for (var i = 0; i < collections.length; i++) {
      var collection = collections[i];
      if (blocked[collection]) return {ok: false, error: blocked[collection], collection: collection};
      var clean = validateCollection(collection, changes[collection]);
      if (clean === null) return {ok: false, error: 'invalid-data', collection: collection};
      encoded[collection] = JSON.stringify({version: 1, items: clean});
      if (utf8Bytes(encoded[collection]) > MAX_STORED_BYTES) return {ok: false, error: 'invalid-data', collection: collection};
      try {
        if (window.localStorage.getItem(KEYS[collection]) !== snapshots[collection]) {
          return {ok: false, error: 'conflict', collection: collection};
        }
      } catch (error) { return {ok: false, error: failureCode(error), collection: collection}; }
    }
    var written = [];
    var failedCollection;
    var failedCode;
    for (var j = 0; j < collections.length; j++) {
      failedCollection = collections[j];
      try {
        if (window.localStorage.getItem(KEYS[failedCollection]) !== snapshots[failedCollection]) {
          failedCode = 'conflict';
          break;
        }
        window.localStorage.setItem(KEYS[failedCollection], encoded[failedCollection]);
        written.push(failedCollection);
      } catch (error) {
        failedCode = failureCode(error);
        break;
      }
    }
    if (failedCode) {
      var affected = [];
      for (var k = written.length - 1; k >= 0; k--) {
        var name = written[k];
        try {
          // Never replace a newer value written by another tab during rollback.
          if (window.localStorage.getItem(KEYS[name]) !== encoded[name]) {
            affected.push(name);
          } else if (snapshots[name] === null) {
            window.localStorage.removeItem(KEYS[name]);
          } else {
            window.localStorage.setItem(KEYS[name], snapshots[name]);
          }
        } catch (error) { affected.push(name); }
      }
      if (affected.length) return {ok: false, error: 'partial-write', collection: failedCollection, affected: affected};
      return {ok: false, error: failedCode, collection: failedCollection};
    }
    collections.forEach(function (name) { snapshots[name] = encoded[name]; });
    return {ok: true};
  }

  function save(collection, items) {
    if (COLLECTIONS.indexOf(collection) < 0) return {ok: false, error: 'invalid-data'};
    var changes = {};
    changes[collection] = items;
    return saveMany(changes);
  }

  function defaults(lang) {
    return ['morning', 'noon', 'evening'].map(function (key) {
      var example = EXAMPLES[key];
      var wording = example[lang === 'en' ? 'en' : 'nl'];
      return {id: 'example-' + key, time: example.time, title: wording[0], text: wording[1],
        days: [0, 1, 2, 3, 4, 5, 6], enabled: true, phraseId: null, exampleKey: key};
    });
  }

  function invalid(code) {
    var error = new Error(code);
    error.code = code;
    throw error;
  }

  function exportData(custom, schedule) {
    var cleanCustom = validateList(custom, validateCustom);
    var cleanSchedule = validateList(schedule, validateSchedule);
    if (!cleanCustom || !cleanSchedule) invalid('invalid-data');
    var json = JSON.stringify({app: 'Grens', version: 1, custom: cleanCustom, schedule: cleanSchedule}, null, 2);
    // Never offer a backup that this version cannot subsequently import.
    if (utf8Bytes(json) > MAX_IMPORT_BYTES) invalid('file-too-large');
    return json;
  }

  function customKey(item) {
    return JSON.stringify([item.text, item.category, item.tone]);
  }

  function scheduleKey(item) {
    // Favorites, enabled status and IDs are state, not content.
    // Recognized examples have the same meaning in both interface languages.
    if (item.exampleKey) return JSON.stringify(['example', item.exampleKey, item.time, item.days]);
    return JSON.stringify([item.time, item.title, item.text, item.days]);
  }

  function uniqueId(used) {
    var value = id();
    while (used[value]) value = 'g-' + Date.now().toString(36) + '-' + (++counter).toString(36);
    return value;
  }

  function importData(json, currentCustom, currentSchedule) {
    if (typeof json !== 'string') invalid('invalid-data');
    if (json.length > MAX_IMPORT_BYTES || utf8Bytes(json) > MAX_IMPORT_BYTES) invalid('file-too-large');
    var parsed;
    try { parsed = JSON.parse(json); } catch (error) { invalid('invalid-json'); }
    if (!record(parsed) || parsed.app !== 'Grens') invalid('invalid-data');
    if (parsed.version !== 1) invalid('unknown-version');
    var incomingCustom = validateList(parsed.custom, validateCustom);
    var incomingSchedule = validateList(parsed.schedule, validateSchedule);
    var custom = validateList(currentCustom, validateCustom);
    var schedule = validateList(currentSchedule, validateSchedule);
    if (!incomingCustom || !incomingSchedule || !custom || !schedule) invalid('invalid-data');

    var ids = Object.create(null);
    var content = Object.create(null);
    var remap = Object.create(null);
    var initialCustom = custom.length;
    var initialSchedule = schedule.length;
    custom.forEach(function (item) { ids[item.id] = item; content[customKey(item)] = item; });
    incomingCustom.forEach(function (item) {
      var original = item.id;
      var key = customKey(item);
      var duplicate = content[key];
      if (duplicate) {
        duplicate.favorite = duplicate.favorite || item.favorite;
        remap[original] = duplicate.id;
        return;
      }
      if (ids[item.id]) item.id = uniqueId(ids);
      ids[item.id] = item;
      content[key] = item;
      remap[original] = item.id;
      custom.push(item);
    });

    var scheduleIds = Object.create(null);
    var scheduleContent = Object.create(null);
    schedule.forEach(function (item) { scheduleIds[item.id] = true; scheduleContent[scheduleKey(item)] = true; });
    incomingSchedule.forEach(function (item) {
      if (item.phraseId) {
        item.phraseId = remap[item.phraseId] || (ids[item.phraseId] ? item.phraseId : null);
        if (item.phraseId) item.text = ids[item.phraseId].text;
      }
      var key = scheduleKey(item);
      if (scheduleContent[key]) return;
      if (scheduleIds[item.id]) item.id = uniqueId(scheduleIds);
      scheduleIds[item.id] = true;
      scheduleContent[key] = true;
      schedule.push(item);
    });
    if (custom.length > MAX_ITEMS || schedule.length > MAX_ITEMS) invalid('too-many-items');
    return {custom: custom, schedule: schedule, addedCustom: custom.length - initialCustom, addedSchedule: schedule.length - initialSchedule};
  }

  window.GrensStore = Object.freeze({load: load, save: save, saveMany: saveMany, id: id,
    validateCustom: validateCustom, validateSchedule: validateSchedule, defaults: defaults,
    exportData: exportData, importData: importData});
}());
