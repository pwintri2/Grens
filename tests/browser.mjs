/* Real-browser acceptance checks. No packages or build step.
   Run: node tests/browser.mjs
   Set CHROME_BIN for a Chrome/Chromium executable outside the default macOS path.
   Each run uses an isolated temporary browser profile; no existing browser data. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir, mkdtemp, rm, readFile, writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = process.env.GRENS_QA_DIR || join(tmpdir(), 'grens-qa');
await mkdir(output, {recursive: true});
const profile = await mkdtemp(join(output, 'browser-profile-'));
const chrome = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const proc = spawn(chrome, [
  '--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
  '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
  '--disable-component-update', '--disable-sync', '--metrics-recording-only',
  '--disable-default-apps', '--disable-extensions', '--disable-features=MediaRouter',
  '--user-data-dir=' + profile, 'about:blank'
], {stdio: ['ignore', 'ignore', 'pipe']});
let stderr = '';
proc.stderr.on('data', d => stderr += d);
let launchError;
proc.on('error', error => { launchError = error; });
let ws;
let send;
const report = [];

try {
  let port;
  for (let i = 0; i < 150; i++) {
    if (launchError) throw launchError;
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch {}
    if (proc.exitCode !== null) throw new Error('Chrome exited: ' + stderr);
    await delay(100);
  }
  if (!port) throw new Error('Chrome debugging port missing. The OS sandbox may block Chrome. ' + stderr);
  const targets = await fetch('http://127.0.0.1:' + port + '/json').then(r => r.json());
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const {resolve, reject} = pending.get(data.id);
      pending.delete(data.id);
      data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result);
    } else {
      events.push(data);
      if (data.method === 'Page.javascriptDialogOpening' && data.params.type === 'confirm') {
        void send('Page.handleJavaScriptDialog', {accept:true});
      }
    }
  };
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, {resolve, reject});
    ws.send(JSON.stringify({id, method, params}));
  });
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true, userGesture: true});
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async function until(expression) {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(50); }
    throw new Error('Timed out: ' + expression);
  }
  async function check(name, expression) {
    assert.equal(await evaluate(expression), true, name);
    report.push(name);
    console.log('PASS ' + name);
  }
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const fill = (selector, value) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); })()`);
  const submit = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).requestSubmit()`);
  const customCount = () => evaluate('document.querySelectorAll("#custom-list > li").length');
  async function reload() {
    await send('Page.reload', {ignoreCache: true});
    await until('document.readyState === "complete" && !!window.GrensStore && document.querySelectorAll("#schedule-days input").length === 7');
  }
  async function key(key, code, windowsVirtualKeyCode, modifiers = 0) {
    await send('Input.dispatchKeyEvent', {type:'rawKeyDown', key, code, windowsVirtualKeyCode, modifiers});
    if (key === 'Enter') await send('Input.dispatchKeyEvent', {type:'char', key, code, windowsVirtualKeyCode, text:'\r', unmodifiedText:'\r', modifiers});
    await send('Input.dispatchKeyEvent', {type:'keyUp', key, code, windowsVirtualKeyCode, modifiers});
  }
  const itemSelector = (list, id, child = '') => `${list} > li[data-id="${id}"]${child ? ' ' + child : ''}`;
  async function custom(text, category = 'werk', tone = 'warm') {
    await click('#custom-add'); await fill('#custom-text', text); await fill('#custom-category', category); await fill('#custom-tone', tone); await submit('#custom-form');
    return evaluate(`Array.from(document.querySelectorAll('#custom-list > li')).find(x => x.textContent.includes(${JSON.stringify(text)}))?.dataset.id`);
  }
  async function moment({title, time, text, days, phrase = ''}) {
    await click('#schedule-add'); await fill('#schedule-title', title); await fill('#schedule-time', time);
    if (phrase) await fill('#schedule-phrase', phrase); else await fill('#schedule-text', text);
    await evaluate(`document.querySelectorAll('input[name="schedule-day"]').forEach(x => { x.checked = ${JSON.stringify(days)}.includes(Number(x.value)); })`);
    await submit('#schedule-form');
    return evaluate(`Array.from(document.querySelectorAll('#schedule-list > li')).find(x => x.textContent.includes(${JSON.stringify(title)}))?.dataset.id`);
  }
  async function importText(text) {
    await evaluate(`(() => { document.querySelector('#personal-import-result').hidden = true; const transfer = new DataTransfer(); transfer.items.add(new File([${JSON.stringify(text)}], 'grens-test.json', {type:'application/json'})); const input = document.querySelector('#personal-import'); input.files = transfer.files; input.dispatchEvent(new Event('change', {bubbles:true})); })()`);
    await until('!document.querySelector("#personal-import-result").hidden');
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Browser.setDownloadBehavior', {behavior:'allow', downloadPath:output});
  await send('Page.addScriptToEvaluateOnNewDocument', {source: `
    window.__qaCopied = null;
    window.__qaPermissionCalls = 0;
    Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText:async text => { window.__qaCopied = text; }}});
    if (window.Notification) Notification.requestPermission = async () => { window.__qaPermissionCalls++; return 'denied'; };
    const originalURL = URL.createObjectURL;
    URL.createObjectURL = function(blob) { window.__qaExport = blob.text(); return originalURL.call(this, blob); };
  `});
  await send('Page.navigate', {url:pathToFileURL(join(root, 'index.html')).href});
  await until('document.readyState === "complete" && !!window.GrensStore && document.querySelectorAll("#schedule-days input").length === 7');
  const legacy = [{id:'legacy-1', text:'Mijn eerder bewaarde zin', lang:'nl', situation:'werk', tone:'warm', createdAt:1234}];
  await evaluate(`localStorage.setItem('neezegger.saved.v1', ${JSON.stringify(JSON.stringify(legacy))}); localStorage.setItem('neezegger.lang.v1', 'nl')`);
  await reload();
  await check('Three default recurring moments', 'document.querySelectorAll("#schedule-list > li").length === 3');
  await click('#saved-toggle');
  await check('Existing saved phrases remain available', 'document.querySelector("#saved-list").textContent.includes("Mijn eerder bewaarde zin")');
  await click('#generate');
  await check('Original phrase generator remains functional', 'document.querySelectorAll("#results-list > li").length === 3');

  await evaluate('document.querySelector("#custom-add").focus()');
  await key('Enter', 'Enter', 13);
  await check('Keyboard opens custom form and focuses text', 'document.activeElement.id === "custom-text" && !document.querySelector("#custom-form").hidden');
  await key('Tab', 'Tab', 9);
  await check('Keyboard Tab reaches category', 'document.activeElement.id === "custom-category"');
  await click('#custom-cancel');
  await check('Cancel returns keyboard focus to add button', 'document.activeElement.id === "custom-add"');
  await click('#custom-add'); await submit('#custom-form');
  await check('Empty custom phrase rejected accessibly', '!document.querySelector("#custom-error").hidden && document.querySelector("#custom-error").getAttribute("role") === "alert"');
  await click('#custom-cancel');
  const hostile = '<img src=x onerror="window.__qaXss=1"> <script>window.__qaXss=2</script> & "quotes"';
  const firstId = await custom(hostile, 'familie', 'duidelijk');
  assert.ok(firstId, 'Created custom phrase has an id');
  await check('XSS-like phrase displayed as literal text', `document.querySelector(${JSON.stringify(itemSelector('#custom-list',firstId))}).textContent.includes(${JSON.stringify(hostile)}) && !document.querySelector('#custom-list img, #custom-list script') && !window.__qaXss`);
  await click(itemSelector('#custom-list', firstId, '[data-action="copy"]'));
  await check('Copy receives exact custom text', `window.__qaCopied === ${JSON.stringify(hostile)}`);
  await click(itemSelector('#custom-list', firstId, '[data-action="favorite"]'));
  await reload();
  await check('Custom phrase and favorite persist across reload', `document.querySelector(${JSON.stringify(itemSelector('#custom-list', firstId, '[data-action="favorite"]'))}).getAttribute('aria-pressed') === 'true' && document.querySelector('#custom-list').textContent.includes(${JSON.stringify(hostile)})`);
  await click(itemSelector('#custom-list',firstId,'[data-action="edit"]'));
  await fill('#custom-text', 'Aangepaste eigen zin');
  await click('[data-lang="en"]');
  await check('Language switch translates UI and preserves edit state', `document.documentElement.lang === 'en' && document.querySelector('#custom-heading').textContent === 'My phrases' && document.querySelector('#custom-text').value === 'Aangepaste eigen zin' && document.querySelector('#custom-category').value === 'familie' && document.querySelector('#custom-tone').value === 'duidelijk' && !document.querySelector('#custom-form').hidden`);
  await submit('#custom-form');
  await check('Editing updates existing phrase', 'document.querySelectorAll("#custom-list > li").length === 1 && document.querySelector("#custom-list").textContent.includes("Aangepaste eigen zin")');
  const secondId = await custom('Tweede zoekbare zin', 'sociaal', 'kort');
  await fill('#custom-search', 'ZoEkBaRe');
  await check('Search ignores case', 'document.querySelectorAll("#custom-list > li").length === 1 && document.querySelector("#custom-list").textContent.includes("Tweede")');
  await fill('#custom-search', ''); await fill('#custom-filter-category', 'familie'); await fill('#custom-filter-tone', 'duidelijk');
  await check('Category and tone filters combine', 'document.querySelectorAll("#custom-list > li").length === 1 && document.querySelector("#custom-list").textContent.includes("Aangepaste")');
  await fill('#custom-filter-category', ''); await fill('#custom-filter-tone', '');
  await click('#custom-filter-favorite');
  await check('Favorites filter shows only favorites', 'document.querySelectorAll("#custom-list > li").length === 1');
  await click('#custom-filter-favorite');
  await click(itemSelector('#custom-list',secondId,'[data-action="remove"]'));
  await check('Custom delete works', 'document.querySelectorAll("#custom-list > li").length === 1');

  await fill('#schedule-date', '2026-09-14'); // Monday, independent of current date/timezone.
  const lateId = await moment({title:'Late Monday', time:'23:30', text:'Later reflecteren', days:[1]});
  const earlyId = await moment({title:'Early Monday', time:'06:15', phrase:firstId, days:[1]});
  assert.ok(lateId && earlyId, 'Created recurring items have ids');
  await check('Daily overview sorts moments by time', `document.querySelector('#schedule-day-list').firstElementChild.dataset.id === ${JSON.stringify(earlyId)} && document.querySelector('#schedule-day-list').lastElementChild.dataset.id === ${JSON.stringify(lateId)}`);
  await click(itemSelector('#schedule-day-list',earlyId,'[data-action="done"]'));
  await reload(); await fill('#schedule-date','2026-09-14');
  await check('Completion persists for its calendar date', `document.querySelector(${JSON.stringify(itemSelector('#schedule-day-list',earlyId,'[data-action="done"]'))}).checked`);
  await fill('#schedule-date','2026-09-21');
  await check('Completion does not leak into another date', `!document.querySelector(${JSON.stringify(itemSelector('#schedule-day-list',earlyId,'[data-action="done"]'))}).checked`);
  await fill('#schedule-date','2026-09-15');
  await check('Monday-only moments absent on Tuesday', `!document.querySelector(${JSON.stringify(itemSelector('#schedule-day-list',earlyId))}) && !document.querySelector(${JSON.stringify(itemSelector('#schedule-day-list',lateId))})`);
  await fill('#schedule-date','2026-09-14');
  await click(itemSelector('#schedule-list',lateId,'[data-action="enabled"]'));
  await check('Disabling removes item from daily overview', `!document.querySelector(${JSON.stringify(itemSelector('#schedule-day-list',lateId))})`);
  await click(itemSelector('#schedule-list',lateId,'[data-action="enabled"]'));
  await click(itemSelector('#schedule-list',lateId,'[data-action="edit"]'));
  await fill('#schedule-time','05:30'); await fill('#schedule-title','Earlier Monday'); await submit('#schedule-form');
  await check('Editing time reorders daily overview', `document.querySelector('#schedule-day-list').firstElementChild.dataset.id === ${JSON.stringify(lateId)}`);
  await click(itemSelector('#custom-list',firstId,'[data-action="edit"]'));
  await fill('#custom-text','Bijgewerkte gekoppelde zin'); await submit('#custom-form');
  await check('Linked recurring moment follows phrase edits', `document.querySelector(${JSON.stringify(itemSelector('#schedule-day-list',earlyId))}).textContent.includes('Bijgewerkte gekoppelde zin')`);
  await click(itemSelector('#custom-list',firstId,'[data-action="remove"]'));
  await check('Deleting linked phrase preserves last moment text', `document.querySelector(${JSON.stringify(itemSelector('#schedule-day-list',earlyId))}).textContent.includes('Bijgewerkte gekoppelde zin')`);
  await click(itemSelector('#schedule-list',lateId,'[data-action="remove"]'));
  await check('Recurring delete removes both views', `!document.querySelector(${JSON.stringify(itemSelector('#schedule-list',lateId))}) && !document.querySelector(${JSON.stringify(itemSelector('#schedule-day-list',lateId))})`);

  await custom(hostile, 'afspraak', 'kort');
  await click('#personal-export');
  const exported = await evaluate('window.__qaExport');
  assert.doesNotThrow(() => JSON.parse(exported), 'Export is valid JSON');
  const beforeImport = await evaluate(`({custom:localStorage.getItem('neezegger.custom.v1'),schedule:localStorage.getItem('neezegger.schedule.v1')})`);
  await importText(exported);
  await check('Reimport skips duplicates', `localStorage.getItem('neezegger.custom.v1') === ${JSON.stringify(beforeImport.custom)} && localStorage.getItem('neezegger.schedule.v1') === ${JSON.stringify(beforeImport.schedule)}`);
  for (const invalid of ['{broken', 'null', '{}', '{"version":999,"custom":[],"schedule":[]}']) {
    await importText(invalid);
    await check('Invalid import leaves collections intact: '+invalid, `localStorage.getItem('neezegger.custom.v1') === ${JSON.stringify(beforeImport.custom)} && localStorage.getItem('neezegger.schedule.v1') === ${JSON.stringify(beforeImport.schedule)}`);
  }
  const countBefore = await customCount();
  await evaluate(`localStorage.removeItem('neezegger.custom.v1'); localStorage.removeItem('neezegger.schedule.v1')`);
  await reload();
  await importText(exported);
  await check('Export restores custom data after a fresh start', `document.querySelectorAll('#custom-list > li').length === ${countBefore} && document.querySelector('#custom-list').textContent.includes(${JSON.stringify(hostile)}) && !window.__qaXss`);
  await check('Import keeps existing saved storage untouched', `localStorage.getItem('neezegger.saved.v1') === ${JSON.stringify(JSON.stringify(legacy))}`);

  await custom('B'.repeat(500), 'werk', 'warm');
  await send('Emulation.setDeviceMetricsOverride', {width:320,height:740,deviceScaleFactor:1,mobile:true});
  await click('#custom-add'); await fill('#custom-text', 'A'.repeat(500));
  await click('#schedule-add'); await fill('#schedule-title','T'.repeat(100));
  await check('320px English layout has no horizontal overflow', 'document.documentElement.scrollWidth <= 320 && document.body.scrollWidth <= 320');
  await click('[data-lang="nl"]');
  await check('320px Dutch layout has no horizontal overflow', 'document.documentElement.scrollWidth <= 320 && document.body.scrollWidth <= 320');
  await until('document.getAnimations().every(animation => animation.playState !== "running") && document.querySelector("#toast").hidden');
  await send('Page.captureScreenshot', {format:'png',captureBeyondViewport:true}).then(r => writeFile(join(output,'mobile-320.png'),Buffer.from(r.data,'base64')));
  for (const section of ['custom','schedule']) {
    await evaluate(`document.querySelector('#${section}').scrollIntoView({block:'start',behavior:'instant'})`);
    await send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false}).then(r => writeFile(join(output,`mobile-320-${section}.png`),Buffer.from(r.data,'base64')));
  }
  await click('#custom-cancel'); await click('#schedule-cancel');
  await evaluate('document.querySelector(".skip-link").focus()');
  const visited = [];
  for (let tab = 0; tab < 200; tab++) {
    await key('Tab','Tab',9);
    const current = await evaluate('({id:document.activeElement.id,skip:document.activeElement.classList.contains("skip-link")})');
    visited.push(current.id);
    if (current.skip) break;
  }
  for (const id of ['custom-add','custom-search','schedule-add','schedule-date','personal-export','personal-import-button']) {
    assert.ok(visited.includes(id), 'Keyboard can reach ' + id);
  }
  report.push('Keyboard traversal reaches all new sections and backup controls without a focus trap');
  const axTree = await send('Accessibility.getFullAXTree');
  const unnamed = axTree.nodes.filter(node => !node.ignored && ['button','textbox','searchbox','combobox','spinbutton','checkbox','radio','link'].includes(node.role?.value) && !node.name?.value);
  assert.deepEqual(unnamed.map(node => ({role:node.role?.value,nodeId:node.nodeId})), [], 'Interactive accessibility nodes have names');
  report.push('Chrome accessibility tree gives every interactive control a name');
  const labels = await evaluate(`Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="file"]),select,textarea')).filter(el => !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')).map(el => el.id || el.name)`);
  assert.deepEqual(labels, [], 'All visible form controls have labels');
  report.push('All form controls have programmatic labels');
  await send('Network.emulateNetworkConditions', {offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await reload();
  await click('#generate');
  await check('Offline file reload loads original and new functionality', 'document.querySelectorAll("#results-list > li").length === 3 && document.querySelectorAll("#custom-list > li").length > 0 && document.querySelectorAll("#schedule-list > li").length > 0');
  await check('No notification permission requested', 'window.__qaPermissionCalls === 0');
  const healthyCustom = await evaluate(`localStorage.getItem('neezegger.custom.v1')`);
  for (const raw of ['{"version":99,"items":[]}', '{broken']) {
    await evaluate(`localStorage.setItem('neezegger.custom.v1', ${JSON.stringify(raw)})`);
    await reload();
    await check('Unreadable storage is preserved and explained: '+raw, `localStorage.getItem('neezegger.custom.v1') === ${JSON.stringify(raw)} && !document.querySelector('#personal-storage-warning').hidden`);
    await click('#custom-add'); await fill('#custom-text', 'Mag oude data niet vervangen'); await submit('#custom-form');
    await check('Saving cannot replace unreadable storage: '+raw, `localStorage.getItem('neezegger.custom.v1') === ${JSON.stringify(raw)}`);
  }
  await evaluate(`localStorage.setItem('neezegger.custom.v1', ${JSON.stringify(healthyCustom)}); localStorage.setItem('neezegger.schedule.v1', '{broken')`);
  await reload();
  const independentId = await custom('Healthy collection stays usable');
  assert.ok(independentId, 'Can create custom phrase with corrupt schedule');
  await click(itemSelector('#custom-list',independentId,'[data-action="edit"]'));
  await fill('#custom-text','Healthy collection can still be edited'); await submit('#custom-form');
  await check('Custom edits work with unrelated corrupt schedule', `document.querySelector('#custom-list').textContent.includes('Healthy collection can still be edited') && localStorage.getItem('neezegger.schedule.v1') === '{broken'`);
  await click(itemSelector('#custom-list',independentId,'[data-action="remove"]'));
  await check('Custom delete works with unrelated corrupt schedule', `!document.querySelector(${JSON.stringify(itemSelector('#custom-list',independentId))}) && localStorage.getItem('neezegger.schedule.v1') === '{broken'`);
  const externalRequests = events.filter(e => e.method === 'Network.requestWillBeSent' && /^https?:/.test(e.params.request.url));
  assert.deepEqual(externalRequests, [], 'Application sends no external requests');
  report.push('Application sends no external requests');
  const exceptions = events.filter(e => e.method === 'Runtime.exceptionThrown');
  assert.deepEqual(exceptions, [], 'No browser JavaScript exceptions');
  report.push('No browser JavaScript exceptions');
  await writeFile(join(output,'browser-results.json'),JSON.stringify({passed:report.length,tests:report,screenshot:join(output,'mobile-320.png')},null,2)+'\n');
  console.log(`\n${report.length} browser acceptance checks passed. Results: ${output}`);
} finally {
  if (send && ws?.readyState === WebSocket.OPEN) {
    await Promise.race([send('Browser.close').catch(() => {}),delay(1500)]);
  }
  ws?.close();
  await delay(200);
  if (proc.exitCode === null) proc.kill('SIGTERM');
  await delay(200);
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
