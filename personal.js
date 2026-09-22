/* Personal phrases and daily rhythm. Plain scripts also work from file://.
   User text only enters the DOM through textContent/value, never HTML. */
(function () {
  'use strict';
  var store = window.GrensStore;
  var $ = function (id) { return document.getElementById(id); };
  var lang = document.documentElement.lang === 'en' ? 'en' : 'nl';
  var words = {
    nl: {
      navigation: 'Onderdelen', generator: 'Zinnen maken', customHeading: 'Mijn zinnen', scheduleHeading: 'Mijn dagritme',
      customIntro: 'Jouw eigen woorden. Gegenereerde zinnen met een hartje vind je bij Bewaard.',
      addPhrase: 'Zin toevoegen', editPhrase: 'Zin bewerken', phraseText: 'Jouw zin',
      textHint: 'Maximaal 500 tekens. Je tekst blijft zoals jij hem schrijft, ook na een taalwisseling.',
      category: 'Categorie', tone: 'Toon', favorite: 'Favoriet', favoritesOnly: 'Alleen favorieten',
      save: 'Opslaan', cancel: 'Annuleren', search: 'Zoek in mijn zinnen', allCategories: 'Alle categorieën', allTones: 'Alle tonen',
      werk: 'Werk', sociaal: 'Sociaal', familie: 'Familie', afspraak: 'Afspraak', warm: 'Warm', kort: 'Kort', duidelijk: 'Duidelijk',
      customEmpty: 'Nog geen eigen zinnen. Voeg een zin toe die voor jou goed voelt.', noMatches: 'Geen zinnen gevonden. Pas je zoekopdracht of filters aan.',
      found: '{n} van {total} eigen zinnen', ownPhrase: 'Eigen zin', copy: 'Kopiëren', copied: 'Gekopieerd',
      copyFailed: 'Kopiëren lukte niet. Selecteer de tekst en kopieer die zelf.', edit: 'Bewerken', remove: 'Verwijderen',
      confirmPhrase: 'Deze eigen zin verwijderen? Een gekoppeld dagritme-moment behoudt de tekst.',
      confirmMoment: 'Dit terugkerende moment verwijderen?', saved: 'Opgeslagen', removed: 'Verwijderd',
      phraseInvalid: 'Vul een zin in van 1 tot 500 tekens en kies een geldige categorie en toon.',
      addMoment: 'Moment toevoegen', editMoment: 'Moment bewerken',
      scheduleIntro: 'Een rustig moment voor jezelf. Bekijk je dag en vink af wat je hebt gedaan.', time: 'Tijd', title: 'Titel',
      linkPhrase: 'Gebruik een eigen zin', noLink: 'Zelf tekst schrijven',
      linkHint: 'Een gekoppelde zin verandert mee. Verwijder je de zin, dan blijft de laatste tekst bij dit moment staan.',
      momentText: 'Tekst voor dit moment', momentHint: 'Maximaal 500 tekens.', repeatDays: 'Herhalen op', enabled: 'Actief', disabled: 'Inactief',
      dayOverview: 'Dagoverzicht', today: 'Vandaag', noMoments: 'Geen actieve momenten op deze dag. Je kunt hieronder je herhalingen aanpassen.',
      manageMoments: 'Alle terugkerende momenten', manageHint: 'Ook momenten die vandaag niet gepland staan, kun je hier aanpassen.',
      noRecurring: 'Je hebt nog geen terugkerende momenten.', progress: '{n} van {total} momenten afgevinkt', done: 'Afgevinkt', complete: 'Afvinken',
      momentInvalid: 'Vul een tijd, titel (1–100 tekens), tekst (1–500 tekens) en minstens één dag in.',
      invalidDate: 'Kies een geldige datum.', backupHeading: 'Een kopie voor jezelf',
      backupIntro: 'Download je eigen zinnen en dagritme als JSON. Importeer ze later op een ander apparaat. Bestaande items blijven behouden; dubbele items worden overgeslagen. Bewaard en afvinkhistorie zitten niet in dit bestand.',
      export: 'JSON exporteren', import: 'JSON importeren',
      localNote: 'Alles blijft in deze browser, op dit apparaat. Er zijn geen meldingen wanneer de site gesloten is.',
      importSuccess: '{phrases} eigen zinnen en {moments} momenten toegevoegd. Dubbele items zijn samengevoegd.',
      importInvalid: 'Dit bestand kon niet worden geïmporteerd. Kies een geldige Grens-export (versie 1, maximaal 1 MB). Je gegevens zijn niet gewijzigd.',
      exportReady: 'Je JSON-bestand is klaar om te downloaden.',
      exportError: 'Exporteren is niet gelukt. Een back-up mag maximaal 1 MiB groot zijn. Je gegevens staan nog in deze browser.',
      storageWarning: 'Sommige lokale gegevens konden niet veilig worden gelezen. Ze zijn niet overschreven. Bewaar eventuele originele gegevens voordat je browseropslag wist.',
      storageError: 'Opslaan is niet gelukt. Je wijziging is niet opgeslagen. Controleer de beschikbare browseropslag en probeer opnieuw.',
      conflict: 'De gegevens zijn in een ander tabblad gewijzigd. Herlaad de pagina voordat je verdergaat; kopieer eerst eventuele onopgeslagen tekst.',
      partialWrite: 'De browseropslag is onderbroken. Herlaad en controleer je gegevens voordat je verdergaat.',
      morningTitle: 'Ochtendcheck', morningText: 'Wat heb ik vandaag echt nodig?',
      noonTitle: 'Middagcheck', noonText: 'Heb ik nog ruimte voor extra verzoeken?',
      eveningTitle: 'Avondcheck', eveningText: 'Welke grens heb ik vandaag bewaakt?',
      days: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'],
      dayShort: ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
    },
    en: {
      navigation: 'Sections', generator: 'Make phrases', customHeading: 'My phrases', scheduleHeading: 'My daily rhythm',
      customIntro: 'Your own words. Generated phrases marked with a heart are in Saved.',
      addPhrase: 'Add a phrase', editPhrase: 'Edit phrase', phraseText: 'Your phrase',
      textHint: 'Up to 500 characters. Your writing stays as you wrote it, even when you change the interface language.',
      category: 'Category', tone: 'Tone', favorite: 'Favourite', favoritesOnly: 'Favourites only',
      save: 'Save', cancel: 'Cancel', search: 'Search my phrases', allCategories: 'All categories', allTones: 'All tones',
      werk: 'Work', sociaal: 'Social', familie: 'Family', afspraak: 'Appointment', warm: 'Warm', kort: 'Short', duidelijk: 'Clear',
      customEmpty: 'No personal phrases yet. Add words that feel right for you.', noMatches: 'No phrases found. Change your search or filters.',
      found: '{n} of {total} personal phrases', ownPhrase: 'Personal phrase', copy: 'Copy', copied: 'Copied',
      copyFailed: 'Could not copy. Select the text and copy it yourself.', edit: 'Edit', remove: 'Delete',
      confirmPhrase: 'Delete this personal phrase? Linked daily moments will keep its text.',
      confirmMoment: 'Delete this recurring moment?', saved: 'Saved', removed: 'Deleted',
      phraseInvalid: 'Enter a phrase of 1–500 characters and choose a valid category and tone.',
      addMoment: 'Add a moment', editMoment: 'Edit moment',
      scheduleIntro: 'A quiet moment for yourself. View your day and check off what you have done.', time: 'Time', title: 'Title',
      linkPhrase: 'Use a personal phrase', noLink: 'Write a separate text',
      linkHint: 'A linked phrase stays up to date. If you delete the phrase, this moment keeps its latest text.',
      momentText: 'Text for this moment', momentHint: 'Up to 500 characters.', repeatDays: 'Repeat on', enabled: 'Active', disabled: 'Inactive',
      dayOverview: 'Daily overview', today: 'Today', noMoments: 'No active moments on this day. You can change your recurring moments below.',
      manageMoments: 'All recurring moments', manageHint: 'You can also edit moments that are not scheduled for today here.',
      noRecurring: 'You have no recurring moments yet.', progress: '{n} of {total} moments checked off', done: 'Done', complete: 'Check off',
      momentInvalid: 'Enter a time, title (1–100 characters), text (1–500 characters) and at least one day.',
      invalidDate: 'Choose a valid date.', backupHeading: 'A copy for yourself',
      backupIntro: 'Download your personal phrases and daily rhythm as JSON. Import them later on another device. Existing items are kept; duplicates are skipped. Saved generated phrases and completion history are not included.',
      export: 'Export JSON', import: 'Import JSON',
      localNote: 'Everything stays in this browser, on this device. There are no notifications when the site is closed.',
      importSuccess: 'Added {phrases} personal phrases and {moments} moments. Duplicates were merged.',
      importInvalid: 'Could not import this file. Choose a valid Grens export (version 1, up to 1 MB). Your data has not changed.',
      exportReady: 'Your JSON file is ready to download.',
      exportError: 'Could not export. A backup can be up to 1 MiB. Your data is still in this browser.',
      storageWarning: 'Some local data could not be read safely. It has not been overwritten. Keep any original data before clearing browser storage.',
      storageError: 'Could not save. Your change has not been saved. Check available browser storage and try again.',
      conflict: 'The data changed in another tab. Reload before continuing; first copy any unsaved text.',
      partialWrite: 'Browser storage was interrupted. Reload and check your data before continuing.',
      morningTitle: 'Morning check-in', morningText: 'What do I really need today?',
      noonTitle: 'Midday check-in', noonText: 'Do I still have room for extra requests?',
      eveningTitle: 'Evening check-in', eveningText: 'Which boundary did I protect today?',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      dayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    }
  };
  var data = store.load();
  var editingPhrase = null;
  var editingMoment = null;
  var formPhraseReturn = null;
  var formMomentReturn = null;
  var toastTimer;
  var noticeKey = '';
  var noticeVars;
  var warningKey = data.warnings.length ? 'storageWarning' : '';
  var categories = ['werk', 'sociaal', 'familie', 'afspraak'];
  var tones = ['warm', 'kort', 'duidelijk'];
  var dayOrder = [1, 2, 3, 4, 5, 6, 0];
  var lastToday = localDate(new Date());
  var selectedDate = lastToday;

  function t(key, vars) {
    var text = words[lang][key];
    if (vars) Object.keys(vars).forEach(function (name) { text = text.split('{' + name + '}').join(String(vars[name])); });
    return text;
  }
  function node(tag, className, text) {
    var result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }
  function focus(element) { if (element) element.focus({ preventScroll: true }); }
  function speak(message) { $('announce').textContent = ''; setTimeout(function () { $('announce').textContent = message; }, 30); }
  function notify(message) {
    speak(message);
    $('toast').textContent = message;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('toast').hidden = true; }, 3200);
  }
  function errorAt(id, key) {
    var target = $(id);
    target.dataset.messageKey = key || '';
    target.textContent = key ? t(key) : '';
    target.hidden = !key;
  }
  function commit(changes, errorId) {
    var result = store.saveMany(changes);
    if (!result.ok) {
      var code = typeof result.error === 'string' ? result.error : result.error && result.error.code;
      warningKey = code === 'conflict' ? 'conflict' : code === 'partial-write' ? 'partialWrite' : ['unknown-version', 'corrupt-data'].includes(code) ? 'storageWarning' : 'storageError';
      renderWarning();
      if (errorId) errorAt(errorId, warningKey);
      speak(t(warningKey));
      return false;
    }
    Object.keys(changes).forEach(function (key) { data[key] = changes[key]; });
    if (warningKey === 'storageError') { warningKey = ''; renderWarning(); }
    return true;
  }
  function renderWarning() {
    $('personal-storage-warning').textContent = warningKey ? t(warningKey) : '';
    $('personal-storage-warning').hidden = !warningKey;
  }
  function localDate(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return null;
    var parts = value.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2], 12);
    return localDate(date) === value ? date : null;
  }
  function phraseFor(id) { return data.custom.find(function (item) { return item.id === id; }); }
  function momentText(item) {
    var phrase = phraseFor(item.phraseId);
    return phrase ? phrase.text : item.exampleKey ? t(item.exampleKey + 'Text') : item.text;
  }
  function momentTitle(item) { return item.exampleKey ? t(item.exampleKey + 'Title') : item.title; }
  function sorted(items) { return items.slice().sort(function (a, b) { return a.time.localeCompare(b.time) || momentTitle(a).localeCompare(momentTitle(b), lang); }); }
  function options(id, values, emptyKey) {
    var select = $(id);
    var previous = select.value;
    select.replaceChildren();
    if (emptyKey) select.appendChild(new Option(t(emptyKey), ''));
    values.forEach(function (value) { select.appendChild(new Option(t(value), value)); });
    if (Array.from(select.options).some(function (option) { return option.value === previous; })) select.value = previous;
  }
  function phraseOptions() {
    var select = $('schedule-phrase');
    var previous = select.value;
    select.replaceChildren(new Option(t('noLink'), ''));
    data.custom.forEach(function (item) { select.appendChild(new Option(item.text.slice(0, 80), item.id)); });
    select.value = phraseFor(previous) ? previous : '';
  }
  function button(key, action, item, callback, description) {
    var result = node('button', 'btn btn--ghost btn--small', t(key));
    result.type = 'button';
    result.dataset.action = action;
    result.id = description + '-' + action;
    result.setAttribute('aria-describedby', description);
    result.addEventListener('click', function () { callback(item, result); });
    return result;
  }
  function copy(text) {
    function fallback() {
      var previous = document.activeElement;
      var field = node('textarea');
      field.value = text; field.readOnly = true;
      field.style.position = 'fixed'; field.style.top = '-1000px';
      document.body.appendChild(field); field.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (error) { /* Show actionable failure. */ }
      field.remove(); focus(previous); return ok;
    }
    var promise = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(function () { return true; }, fallback) : Promise.resolve(fallback());
    promise.then(function (ok) { notify(t(ok ? 'copied' : 'copyFailed')); });
  }

  function renderCustom() {
    var query = $('custom-search').value.trim().toLocaleLowerCase(lang);
    var category = $('custom-filter-category').value;
    var tone = $('custom-filter-tone').value;
    var favorite = $('custom-filter-favorite').checked;
    var items = data.custom.filter(function (item) {
      return (!query || item.text.toLocaleLowerCase(lang).includes(query)) && (!category || item.category === category) && (!tone || item.tone === tone) && (!favorite || item.favorite);
    });
    $('custom-count').textContent = t('found', { n: items.length, total: data.custom.length });
    $('custom-empty').textContent = t(data.custom.length ? 'noMatches' : 'customEmpty');
    $('custom-empty').hidden = items.length > 0;
    $('custom-list').hidden = !items.length;
    $('custom-list').replaceChildren();
    items.forEach(function (item) {
      var card = node('li', 'card'); card.dataset.id = item.id;
      var text = node('p', 'card__text', item.text); text.id = 'custom-text-' + item.id;
      var meta = node('p', 'field__hint', t('ownPhrase') + ' · ' + t(item.category) + ' · ' + t(item.tone));
      var actions = node('div', 'card__actions');
      actions.appendChild(button('copy', 'copy', item, function (phrase) { copy(phrase.text); }, text.id));
      var heart = button('favorite', 'favorite', item, function (phrase, control) {
        var next = data.custom.map(function (value) { return value.id === phrase.id ? Object.assign({}, value, { favorite: !value.favorite }) : value; });
        if (commit({ custom: next })) { renderCustom(); focus($(control.id) || $('custom-heading')); }
      }, text.id);
      heart.setAttribute('aria-pressed', String(item.favorite)); actions.appendChild(heart);
      actions.appendChild(button('edit', 'edit', item, openPhrase, text.id));
      actions.appendChild(button('remove', 'remove', item, removePhrase, text.id));
      card.append(meta, text, actions); $('custom-list').appendChild(card);
    });
    phraseOptions();
  }
  function openPhrase(item, control) {
    editingPhrase = item ? item.id : null;
    formPhraseReturn = control ? control.id : 'custom-add';
    $('custom-form').reset();
    $('custom-text').value = item ? item.text : '';
    $('custom-category').value = item ? item.category : 'werk';
    $('custom-tone').value = item ? item.tone : 'warm';
    $('custom-favorite').checked = item ? item.favorite : false;
    $('custom-form-heading').textContent = t(item ? 'editPhrase' : 'addPhrase');
    errorAt('custom-error', '');
    $('custom-form').hidden = false; $('custom-add').setAttribute('aria-expanded', 'true');
    $('custom-text').focus();
  }
  function closePhrase() {
    $('custom-form').hidden = true; $('custom-add').setAttribute('aria-expanded', 'false');
    editingPhrase = null; focus($(formPhraseReturn) || $('custom-add'));
  }
  function removePhrase(item) {
    if (!window.confirm(t('confirmPhrase'))) return;
    var nextSchedule = data.schedule.map(function (moment) {
      return moment.phraseId === item.id ? Object.assign({}, moment, { phraseId: null, text: item.text }) : moment;
    });
    var changes = { custom: data.custom.filter(function (phrase) { return phrase.id !== item.id; }) };
    if (data.schedule.some(function (moment) { return moment.phraseId === item.id; })) changes.schedule = nextSchedule;
    if (!commit(changes)) return;
    if (editingPhrase === item.id) closePhrase();
    if ($('schedule-phrase').value === item.id) { $('schedule-text').value = item.text; $('schedule-text').readOnly = false; }
    renderCustom(); renderSchedule(); focus($('custom-heading')); notify(t('removed'));
  }
  $('custom-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var item = store.validateCustom({ id: editingPhrase || store.id(), text: $('custom-text').value.trim(), category: $('custom-category').value, tone: $('custom-tone').value, favorite: $('custom-favorite').checked });
    if (!item) { errorAt('custom-error', 'phraseInvalid'); $('custom-text').focus(); return; }
    var next = editingPhrase ? data.custom.map(function (phrase) { return phrase.id === editingPhrase ? item : phrase; }) : [item].concat(data.custom);
    var nextSchedule = data.schedule.map(function (moment) { return moment.phraseId === item.id ? Object.assign({}, moment, { text: item.text }) : moment; });
    var changes = { custom: next };
    if (data.schedule.some(function (moment) { return moment.phraseId === item.id && moment.text !== item.text; })) changes.schedule = nextSchedule;
    if (!commit(changes, 'custom-error')) return;
    if (!editingPhrase) { $('custom-search').value = ''; $('custom-filter-category').value = ''; $('custom-filter-tone').value = ''; $('custom-filter-favorite').checked = false; }
    renderCustom(); renderSchedule();
    if ($('schedule-phrase').value === item.id) $('schedule-text').value = item.text;
    closePhrase(); notify(t('saved'));
  });

  function dayChoices() {
    var checked = Array.from($('schedule-days').querySelectorAll('input:checked')).map(function (input) { return Number(input.value); });
    $('schedule-days').replaceChildren();
    dayOrder.forEach(function (day) {
      var label = node('label', 'check-label day-choice');
      var input = node('input'); input.type = 'checkbox'; input.name = 'schedule-day'; input.value = String(day); input.checked = checked.includes(day);
      input.setAttribute('aria-label', t('days')[day]);
      label.append(input, node('span', '', t('dayShort')[day])); $('schedule-days').appendChild(label);
    });
  }
  function openMoment(item, control) {
    editingMoment = item ? item.id : null;
    formMomentReturn = control ? control.id : 'schedule-add';
    $('schedule-form').reset(); phraseOptions();
    $('schedule-time').value = item ? item.time : '08:00';
    $('schedule-title').value = item ? momentTitle(item) : '';
    $('schedule-phrase').value = item && phraseFor(item.phraseId) ? item.phraseId : '';
    $('schedule-text').value = item ? momentText(item) : '';
    $('schedule-text').readOnly = !!$('schedule-phrase').value;
    $('schedule-enabled').checked = item ? item.enabled : true;
    Array.from($('schedule-days').querySelectorAll('input')).forEach(function (input) { input.checked = !item || item.days.includes(Number(input.value)); });
    $('schedule-form-heading').textContent = t(item ? 'editMoment' : 'addMoment');
    errorAt('schedule-error', '');
    $('schedule-form').hidden = false; $('schedule-add').setAttribute('aria-expanded', 'true'); $('schedule-title').focus();
  }
  function closeMoment() {
    $('schedule-form').hidden = true; $('schedule-add').setAttribute('aria-expanded', 'false');
    editingMoment = null; focus($(formMomentReturn) || $('schedule-add'));
  }
  function removeMoment(item) {
    if (!window.confirm(t('confirmMoment'))) return;
    if (!commit({ schedule: data.schedule.filter(function (moment) { return moment.id !== item.id; }) })) return;
    if (editingMoment === item.id) closeMoment();
    renderSchedule(); focus($('schedule-heading')); notify(t('removed'));
  }
  $('schedule-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var phrase = phraseFor($('schedule-phrase').value);
    var item = store.validateSchedule({ id: editingMoment || store.id(), time: $('schedule-time').value, title: $('schedule-title').value.trim(), text: phrase ? phrase.text : $('schedule-text').value.trim(), phraseId: phrase ? phrase.id : null, days: Array.from($('schedule-days').querySelectorAll('input:checked')).map(function (input) { return Number(input.value); }), enabled: $('schedule-enabled').checked });
    if (!item) {
      errorAt('schedule-error', 'momentInvalid');
      var invalid = !$('schedule-title').value.trim() ? $('schedule-title') : !$('schedule-time').value ? $('schedule-time') : !$('schedule-text').value.trim() ? $('schedule-text') : $('schedule-days').querySelector('input');
      invalid.focus(); return;
    }
    var next = editingMoment ? data.schedule.map(function (moment) { return moment.id === editingMoment ? item : moment; }) : data.schedule.concat([item]);
    if (!commit({ schedule: next }, 'schedule-error')) return;
    renderSchedule(); closeMoment(); notify(t('saved'));
  });
  function renderSchedule() {
    $('schedule-list').replaceChildren(); $('schedule-all-empty').hidden = data.schedule.length > 0;
    sorted(data.schedule).forEach(function (item) {
      var card = node('li', 'card'); card.dataset.id = item.id;
      var title = node('h3', 'moment-title', item.time + ' · ' + momentTitle(item)); title.id = 'moment-' + item.id;
      var text = node('p', 'card__text', momentText(item));
      var days = node('p', 'field__hint', dayOrder.filter(function (day) { return item.days.includes(day); }).map(function (day) { return t('dayShort')[day]; }).join(' · '));
      var actions = node('div', 'card__actions');
      var label = node('label', 'check-label');
      var enabled = node('input'); enabled.type = 'checkbox'; enabled.checked = item.enabled; enabled.dataset.action = 'enabled'; enabled.id = title.id + '-enabled'; enabled.setAttribute('aria-describedby', title.id);
      enabled.addEventListener('change', function () {
        var next = data.schedule.map(function (moment) { return moment.id === item.id ? Object.assign({}, moment, { enabled: enabled.checked }) : moment; });
        if (commit({ schedule: next })) { renderSchedule(); focus($(enabled.id)); } else enabled.checked = item.enabled;
      });
      label.append(enabled, node('span', '', t('enabled'))); actions.appendChild(label);
      if (!item.enabled) card.classList.add('moment--inactive');
      actions.appendChild(button('edit', 'edit', item, openMoment, title.id));
      actions.appendChild(button('remove', 'remove', item, removeMoment, title.id));
      card.append(title, days, text, actions); $('schedule-list').appendChild(card);
    });
    renderDay();
  }
  function renderDay() {
    var date = parseDate(selectedDate);
    if (!date) return;
    var items = sorted(data.schedule.filter(function (item) { return item.enabled && item.days.includes(date.getDay()); }));
    var done = data.dailyLog[selectedDate] || [];
    var count = items.filter(function (item) { return done.includes(item.id); }).length;
    $('schedule-progress').textContent = t('progress', { n: count, total: items.length });
    $('schedule-empty').hidden = items.length > 0; $('schedule-day-list').replaceChildren();
    items.forEach(function (item) {
      var checked = done.includes(item.id);
      var card = node('li', 'card day-moment' + (checked ? ' is-complete' : '')); card.dataset.id = item.id;
      var top = node('div', 'day-moment__top');
      var title = node('h3', 'moment-title', momentTitle(item)); title.id = 'day-moment-' + item.id;
      var time = node('time', 'moment-time', item.time); time.dateTime = item.time;
      top.append(time, title);
      var text = node('p', 'card__text', momentText(item));
      var label = node('label', 'check-label');
      var checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.checked = checked; checkbox.dataset.action = 'done'; checkbox.id = title.id + '-done'; checkbox.setAttribute('aria-describedby', title.id);
      checkbox.addEventListener('change', function () {
        var log = Object.assign({}, data.dailyLog);
        var ids = (log[selectedDate] || []).filter(function (id) { return id !== item.id; });
        if (checkbox.checked) ids.push(item.id);
        if (ids.length) log[selectedDate] = ids; else delete log[selectedDate];
        if (commit({ dailyLog: log })) { renderDay(); focus($(checkbox.id)); } else checkbox.checked = checked;
      });
      label.append(checkbox, node('span', '', t(checked ? 'done' : 'complete')));
      card.append(top, text, label); $('schedule-day-list').appendChild(card);
    });
  }
  function translate() {
    lang = document.documentElement.lang === 'en' ? 'en' : 'nl';
    document.querySelectorAll('[data-personal-i18n]').forEach(function (element) { element.textContent = t(element.dataset.personalI18n); });
    document.querySelectorAll('[data-personal-aria]').forEach(function (element) { element.setAttribute('aria-label', t(element.dataset.personalAria)); });
    options('custom-category', categories); options('custom-tone', tones);
    options('custom-filter-category', categories, 'allCategories'); options('custom-filter-tone', tones, 'allTones');
    $('custom-form-heading').textContent = t(editingPhrase ? 'editPhrase' : 'addPhrase');
    $('schedule-form-heading').textContent = t(editingMoment ? 'editMoment' : 'addMoment');
    ['custom-error', 'schedule-error', 'schedule-date-error'].forEach(function (id) { errorAt(id, $(id).dataset.messageKey || ''); });
    dayChoices(); renderCustom(); renderSchedule(); renderWarning();
    if (noticeKey) $('personal-import-result').textContent = t(noticeKey, noticeVars);
  }
  $('custom-add').addEventListener('click', function () { openPhrase(); });
  $('custom-cancel').addEventListener('click', closePhrase);
  ['custom-search', 'custom-filter-category', 'custom-filter-tone', 'custom-filter-favorite'].forEach(function (id) { $(id).addEventListener(id === 'custom-search' ? 'input' : 'change', renderCustom); });
  $('schedule-add').addEventListener('click', function () { openMoment(); });
  $('schedule-cancel').addEventListener('click', closeMoment);
  $('schedule-phrase').addEventListener('change', function () {
    var phrase = phraseFor(this.value); $('schedule-text').readOnly = !!phrase;
    if (phrase) $('schedule-text').value = phrase.text;
  });
  $('schedule-date').value = selectedDate;
  $('schedule-date').addEventListener('change', function () {
    if (!parseDate(this.value)) { errorAt('schedule-date-error', 'invalidDate'); return; }
    errorAt('schedule-date-error', ''); selectedDate = this.value; renderDay();
  });
  $('schedule-today').addEventListener('click', function () {
    selectedDate = localDate(new Date()); $('schedule-date').value = selectedDate; errorAt('schedule-date-error', ''); renderDay();
  });
  ['custom-form', 'schedule-form'].forEach(function (id) {
    $(id).addEventListener('keydown', function (event) { if (event.key === 'Escape') { event.preventDefault(); if (id === 'custom-form') closePhrase(); else closeMoment(); } });
  });
  $('personal-export').addEventListener('click', function () {
    try {
      var blob = new Blob([store.exportData(data.custom, data.schedule)], { type: 'application/json' });
      var url = URL.createObjectURL(blob); var link = node('a'); link.href = url; link.download = 'grens-' + localDate(new Date()) + '.json';
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
      notify(t('exportReady'));
    } catch (error) { notify(t('exportError')); }
  });
  $('personal-import-button').addEventListener('click', function () { $('personal-import').click(); });
  $('personal-import').addEventListener('change', async function () {
    var file = this.files[0]; if (!file) return;
    noticeKey = ''; noticeVars = null;
    $('personal-import-result').textContent = ''; $('personal-import-result').hidden = true;
    $('personal-import-button').disabled = true;
    try {
      if (file.size > 1024 * 1024) throw new Error('too-large');
      var merged = store.importData(await file.text(), data.custom, data.schedule);
      if (!commit({ custom: merged.custom, schedule: merged.schedule })) return;
      renderCustom(); renderSchedule();
      noticeKey = 'importSuccess'; noticeVars = { phrases: merged.addedCustom, moments: merged.addedSchedule };
    } catch (error) { noticeKey = 'importInvalid'; noticeVars = null; }
    finally { this.value = ''; $('personal-import-button').disabled = false; }
    $('personal-import-result').textContent = t(noticeKey, noticeVars); $('personal-import-result').hidden = false; speak(t(noticeKey, noticeVars));
  });
  document.addEventListener('grens:language', translate);
  window.addEventListener('storage', function (event) {
    if (event.key === null || /^neezegger\.(custom|schedule|daily-log)\.v1$/.test(event.key)) { warningKey = 'conflict'; renderWarning(); }
  });
  function checkDay() {
    var today = localDate(new Date());
    if (today !== lastToday) {
      if (selectedDate === lastToday) { selectedDate = today; $('schedule-date').value = today; renderDay(); }
      lastToday = today;
    }
  }
  window.setInterval(checkDay, 30000);
  document.addEventListener('visibilitychange', checkDay);
  if (data.missing.includes('schedule')) {
    var defaults = store.defaults(lang);
    if (!commit({ schedule: defaults })) data.schedule = defaults;
  }
  translate();
})();
