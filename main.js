/* Nee-zegger Script Generator – logica
   Vanilla JavaScript, geen backend. Bewaarde zinnen staan in localStorage. */
(function () {
  'use strict';

  var STORAGE_SAVED = 'neezegger.saved.v1';
  var STORAGE_LANG = 'neezegger.lang.v1';
  var SITUATIONS = ['werk', 'sociaal', 'familie', 'afspraak'];
  var TONES = ['warm', 'kort', 'duidelijk'];
  var MAX_LENGTH = 140;
  var CONTENT = window.NEEZEGGER_CONTENT || {};

  /* ---------- Teksten van de interface ---------- */
  var UI = {
    nl: {
      'meta.title': 'Nee-zegger Script Generator',
      'meta.description': 'Korte, vriendelijke zinnen om nee te zeggen zonder uitgebreide uitleg of schuldgevoel.',
      'ui.skip': 'Naar de inhoud',
      'ui.brand': 'Nee-zegger',
      'ui.savedButton': 'Bewaard',
      'ui.savedButtonAria': 'Bewaarde zinnen, {n} bewaard',
      'ui.title': 'Een nee mag ook een hele zin zijn.',
      'ui.lead': 'Kies een situatie en een toon. Je krijgt drie korte zinnen om een verzoek af te wijzen, zonder lange uitleg en zonder schuldgevoel.',
      'ui.situationLegend': 'Situatie',
      'ui.toneLegend': 'Toon',
      'ui.topicLabel': 'Waar gaat het verzoek over?',
      'ui.topicHint': 'Mag leeg blijven. Schrijf kort op wat er van je gevraagd wordt.',
      'ui.generate': 'Geef me woorden',
      'ui.surprise': 'Verras me',
      'ui.resultsEmptyHeading': 'Jouw zinnen',
      'ui.resultsEmpty': 'Hier verschijnen straks drie zinnen. Kies een situatie en een toon, en druk op ‘Geef me woorden’. Je hoeft niets in te vullen.',
      'ui.resultsFirst': 'Zinnen voor jouw situatie',
      'ui.resultsNew': 'Nieuwe zinnen voor jou',
      'ui.resultsSub': '{situation} · {tone}',
      'ui.surpriseNote': 'Verrassende combinatie voor je gekozen.',
      'ui.announceResults': '{heading}. {situation}, toon {tone}. Drie zinnen.',
      'ui.copy': 'Kopiëren',
      'ui.copied': 'Gekopieerd',
      'ui.copyFailed': 'Kopiëren lukte niet. Selecteer de tekst en kopieer die zelf.',
      'ui.save': 'Bewaar deze zin',
      'ui.savedToast': 'Bewaard',
      'ui.savedAnnounce': 'Bewaard. Je hebt nu {n} bewaarde zinnen.',
      'ui.removedToast': 'Verwijderd uit je bewaarde zinnen',
      'ui.removedAnnounce': 'Verwijderd. Je hebt nu {n} bewaarde zinnen.',
      'ui.limitReached': 'Maximum van 140 tekens bereikt.',
      'ui.remove': 'Verwijderen',
      'ui.savedHeading': 'Bewaarde zinnen',
      'ui.savedEmpty': 'Nog niets bewaard. Tik op het hartje bij een zin om die hier te bewaren.',
      'ui.close': 'Sluiten',
      'ui.footerNote': 'Dit is een hulpmiddel om woorden te vinden, geen therapie of medisch advies.',
      'ui.footerLocal': 'Bewaarde zinnen blijven op dit apparaat. Er wordt niets verstuurd.',
      'ui.langAnnounce': 'Taal: Nederlands',
      'ui.contentMissing': 'De zinnen konden niet worden geladen. Controleer of phrases.js naast index.html staat.',
      'tones.warm.label': 'Warm',
      'tones.warm.hint': 'vriendelijk en begripvol',
      'tones.kort.label': 'Kort',
      'tones.kort.hint': 'één of twee zinnen',
      'tones.duidelijk.label': 'Duidelijk',
      'tones.duidelijk.hint': 'een heldere grens',
      'situations.werk.label': 'Werk',
      'situations.werk.placeholder': 'Bijvoorbeeld: een extra dienst draaien',
      'situations.sociaal.label': 'Sociaal',
      'situations.sociaal.placeholder': 'Bijvoorbeeld: een etentje afzeggen',
      'situations.familie.label': 'Familie',
      'situations.familie.placeholder': 'Bijvoorbeeld: zondag niet langskomen',
      'situations.afspraak.label': 'Afspraak',
      'situations.afspraak.placeholder': 'Bijvoorbeeld: een afspraak verzetten'
    },
    en: {
      'meta.title': 'No-Sayer Script Generator',
      'meta.description': 'Short, friendly phrases for saying no without long explanations or guilt.',
      'ui.skip': 'Skip to content',
      'ui.brand': 'No-Sayer',
      'ui.savedButton': 'Saved',
      'ui.savedButtonAria': 'Saved phrases, {n} saved',
      'ui.title': "'No' can be a complete sentence.",
      'ui.lead': 'Pick a situation and a tone. You get three short phrases to decline a request, without long explanations and without guilt.',
      'ui.situationLegend': 'Situation',
      'ui.toneLegend': 'Tone',
      'ui.topicLabel': 'What is the request about?',
      'ui.topicHint': 'You can leave this empty. Briefly say what you are being asked.',
      'ui.generate': 'Give me words',
      'ui.surprise': 'Surprise me',
      'ui.resultsEmptyHeading': 'Your phrases',
      'ui.resultsEmpty': "Three phrases will appear here. Pick a situation and a tone, then press 'Give me words'. You don't have to fill anything in.",
      'ui.resultsFirst': 'Phrases for your situation',
      'ui.resultsNew': 'New phrases for you',
      'ui.resultsSub': '{situation} · {tone}',
      'ui.surpriseNote': 'A surprise combination was picked for you.',
      'ui.announceResults': '{heading}. {situation}, {tone} tone. Three phrases.',
      'ui.copy': 'Copy',
      'ui.copied': 'Copied',
      'ui.copyFailed': "Copying didn't work. Select the text and copy it yourself.",
      'ui.save': 'Save this phrase',
      'ui.savedToast': 'Saved',
      'ui.savedAnnounce': 'Saved. You now have {n} saved phrases.',
      'ui.removedToast': 'Removed from your saved phrases',
      'ui.removedAnnounce': 'Removed. You now have {n} saved phrases.',
      'ui.limitReached': 'Maximum of 140 characters reached.',
      'ui.remove': 'Remove',
      'ui.savedHeading': 'Saved phrases',
      'ui.savedEmpty': 'Nothing saved yet. Tap the heart next to a phrase to keep it here.',
      'ui.close': 'Close',
      'ui.footerNote': 'This is a tool for finding words, not therapy or medical advice.',
      'ui.footerLocal': 'Saved phrases stay on this device. Nothing is sent anywhere.',
      'ui.langAnnounce': 'Language: English',
      'ui.contentMissing': 'The phrases could not be loaded. Check that phrases.js sits next to index.html.',
      'tones.warm.label': 'Warm',
      'tones.warm.hint': 'friendly and understanding',
      'tones.kort.label': 'Short',
      'tones.kort.hint': 'one or two sentences',
      'tones.duidelijk.label': 'Clear',
      'tones.duidelijk.hint': 'a firm boundary',
      'situations.werk.label': 'Work',
      'situations.werk.placeholder': 'For example: taking an extra shift',
      'situations.sociaal.label': 'Social',
      'situations.sociaal.placeholder': 'For example: dinner on Saturday',
      'situations.familie.label': 'Family',
      'situations.familie.placeholder': 'For example: coming over on Sunday',
      'situations.afspraak.label': 'Appointment',
      'situations.afspraak.placeholder': "For example: Tuesday's appointment"
    }
  };

  /* Mobiele toetsenborden beginnen vaak met een hoofdletter. Staat het onderwerp
     midden in een zin, dan maken we de eerste letter klein, behalve als het op een
     eigennaam lijkt: een afkorting in hoofdletters, een bezitsvorm ("Anna's"),
     een tweede woord met hoofdletter ("Oma Jansen"), één enkel woord, of (Engels)
     een dag- of maandnaam. */
  var KEEP_CAPS = {
    nl: [],
    en: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'christmas', 'easter', 'i']
  };
  /* Bezitsvormen die geen naam zijn ("oma's verjaardag", "tomorrow's meeting"). */
  var COMMON_POSSESSIVES = {
    nl: ['oma', 'opa', 'mama', 'papa', 'ma', 'pa', 'tante', 'oom', 'zus', 'broer', 'moeder', 'vader', 'buurvrouw', 'buurman', 'collega', 'baas', 'vriendin', 'vriend', 'schoonmoeder', 'schoonvader'],
    en: ['tomorrow', 'today', 'tonight', 'mum', 'mom', 'dad', 'grandma', 'grandpa', 'nan', 'work', 'school', 'team', 'boss', 'colleague', 'friend', 'sister', 'brother', 'mother', 'father', 'neighbour', 'neighbor']
  };

  /* ---------- Elementen ---------- */
  var el = {
    langButtons: Array.prototype.slice.call(document.querySelectorAll('.lang-switch__btn')),
    savedToggle: document.getElementById('saved-toggle'),
    savedBadge: document.getElementById('saved-count-badge'),
    savedSection: document.getElementById('saved'),
    savedHeading: document.getElementById('saved-heading'),
    savedCount: document.getElementById('saved-count'),
    savedClose: document.getElementById('saved-close'),
    savedEmpty: document.getElementById('saved-empty'),
    savedList: document.getElementById('saved-list'),
    form: document.getElementById('generator'),
    situationInputs: Array.prototype.slice.call(document.querySelectorAll('input[name="situation"]')),
    toneInputs: Array.prototype.slice.call(document.querySelectorAll('input[name="tone"]')),
    topic: document.getElementById('topic'),
    topicCount: document.getElementById('topic-count'),
    topicCountValue: document.getElementById('topic-count-value'),
    generate: document.getElementById('generate'),
    surprise: document.getElementById('surprise'),
    results: document.getElementById('results'),
    resultsHeading: document.getElementById('results-heading'),
    resultsSub: document.getElementById('results-sub'),
    resultsNote: document.getElementById('results-note'),
    resultsEmpty: document.getElementById('results-empty'),
    resultsList: document.getElementById('results-list'),
    announce: document.getElementById('announce'),
    toast: document.getElementById('toast'),
    cardTemplate: document.getElementById('card-template')
  };

  /* ---------- Toestand ---------- */
  var state = {
    lang: 'nl',
    situation: 'werk',
    tone: 'warm',
    results: [],
    saved: [],
    lastIndexes: [],
    lastExample: '',
    autoFilledTopic: '',
    hasGenerated: false,
    surpriseNote: '',
    limitAnnounced: false
  };
  var toastTimer = null;

  /* ---------- Hulpfuncties ---------- */
  function t(key, vars) {
    var table = UI[state.lang] || UI.nl;
    var text = table[key];
    if (text === undefined) text = UI.nl[key] !== undefined ? UI.nl[key] : key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        text = text.split('{' + name + '}').join(String(vars[name]));
      });
    }
    return text;
  }

  function contentFor(lang) {
    return CONTENT[lang] || CONTENT.nl || null;
  }

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function pick(list, avoid) {
    if (!list || !list.length) return '';
    if (list.length > 1 && avoid !== undefined) {
      var candidates = list.filter(function (item) { return item !== avoid; });
      return candidates[randomInt(candidates.length)];
    }
    return list[randomInt(list.length)];
  }

  function shuffledIndexes(length) {
    var indexes = [];
    for (var i = 0; i < length; i++) indexes.push(i);
    for (var j = indexes.length - 1; j > 0; j--) {
      var k = randomInt(j + 1);
      var tmp = indexes[j]; indexes[j] = indexes[k]; indexes[k] = tmp;
    }
    return indexes;
  }

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    var sortedA = a.slice().sort();
    var sortedB = b.slice().sort();
    return sortedA.every(function (value, index) { return value === sortedB[index]; });
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function capitalizeFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function softenFirst(text, lang) {
    var words = text.split(/\s+/);
    var first = words[0] || '';
    var second = words[1] || '';
    var base = first.toLowerCase().replace(/['’]s$/, '').replace(/[^a-zà-ÿ]/g, '');
    if (!/^[A-ZÀ-Ý]([a-zà-ÿ'’]|$)/.test(first)) return text;
    if (words.length === 1) return text;
    if (/^[A-ZÀ-Ý]{2,}$/.test(first.replace(/[^A-ZÀ-Ýa-zà-ÿ]/g, ''))) return text;
    if ((KEEP_CAPS[lang] || []).indexOf(base) !== -1) return text;
    if (/['’]s$/i.test(first) && (COMMON_POSSESSIVES[lang] || []).indexOf(base) === -1) return text;
    if (/^[A-ZÀ-Ý]/.test(second) && !/['’]s$/i.test(first)) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  }

  function cleanTopic(raw) {
    var text = String(raw || '').replace(/\s+/g, ' ').trim();
    text = text.replace(/^(bijvoorbeeld|for example)\s*:\s*/i, '');
    var wrapped = text.match(/^(["“”‘’'])(.+)(["“”‘’'])$/);
    if (wrapped && wrapped[2].length > 1) text = wrapped[2].trim();
    text = text.replace(/^["“”]+|["“”]+$/g, '');
    text = text.replace(/[.!?,;:]+$/g, '').trim();
    return text;
  }

  function fillTemplate(template, topic, lang) {
    var index = template.indexOf('{x}');
    if (index === -1) return template;
    var filled = index === 0 ? capitalizeFirst(topic) : softenFirst(topic, lang);
    return template.split('{x}').join(filled);
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function findSaved(text, lang) {
    for (var i = 0; i < state.saved.length; i++) {
      if (state.saved[i].text === text && state.saved[i].lang === lang) return i;
    }
    return -1;
  }

  /* ---------- Opslag ---------- */
  function loadSaved() {
    try {
      var raw = window.localStorage.getItem(STORAGE_SAVED);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      var seenKeys = {};
      var seenIds = {};
      var result = [];
      parsed.forEach(function (item) {
        if (!item || typeof item.text !== 'string' || !item.text.trim()) return;
        var lang = item.lang === 'en' ? 'en' : 'nl';
        var key = lang + '|' + item.text;
        if (seenKeys[key]) return;
        seenKeys[key] = true;
        var id = typeof item.id === 'string' && /^[A-Za-z0-9_-]+$/.test(item.id) ? item.id : '';
        if (!id || seenIds[id]) id = newId();
        seenIds[id] = true;
        result.push({
          id: id,
          text: item.text,
          lang: lang,
          situation: SITUATIONS.indexOf(item.situation) !== -1 ? item.situation : '',
          tone: TONES.indexOf(item.tone) !== -1 ? item.tone : '',
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : 0
        });
      });
      return result;
    } catch (error) {
      return [];
    }
  }

  function persistSaved() {
    try {
      window.localStorage.setItem(STORAGE_SAVED, JSON.stringify(state.saved));
    } catch (error) {
      /* Opslag niet beschikbaar (bijv. privémodus): de app blijft gewoon werken. */
    }
  }

  function loadLang() {
    try {
      var stored = window.localStorage.getItem(STORAGE_LANG);
      if (stored === 'nl' || stored === 'en') return stored;
    } catch (error) { /* negeren */ }
    return 'nl';
  }

  function persistLang() {
    try { window.localStorage.setItem(STORAGE_LANG, state.lang); } catch (error) { /* negeren */ }
  }

  /* ---------- Meldingen ---------- */
  function showToast(message, spokenMessage) {
    announce(spokenMessage || message);
    el.toast.textContent = message;
    el.toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.hidden = true;
      el.toast.textContent = '';
    }, 2200);
  }

  function announce(message) {
    el.announce.textContent = '';
    setTimeout(function () { el.announce.textContent = message; }, 30);
  }

  /* ---------- Taal ---------- */
  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.title = t('meta.title');
    var metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', t('meta.description'));
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });
    el.langButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-lang') === state.lang ? 'true' : 'false');
    });
    updatePlaceholder();
    updateSavedCount();
    renderSaved();
    if (state.results.length) renderResults();
    document.dispatchEvent(new Event('grens:language'));
  }

  function setLanguage(lang, fromUser) {
    if (lang !== 'nl' && lang !== 'en') return;
    var changed = lang !== state.lang;
    state.lang = lang;
    persistLang();
    applyLanguage();
    if (!changed) return;
    if (state.autoFilledTopic && el.topic.value === state.autoFilledTopic) {
      var content = contentFor(state.lang);
      var example = content ? pick(content.examples[state.situation] || []) : '';
      if (example) {
        el.topic.value = example;
        state.autoFilledTopic = example;
        state.lastExample = example;
        updateCounter();
      }
    }
    if (state.results.length) {
      generate({ headingKey: 'ui.resultsFirst', keepNote: false, scroll: false });
    }
    if (fromUser) announce(t('ui.langAnnounce'));
  }

  /* ---------- Formulier ---------- */
  function updatePlaceholder() {
    el.topic.placeholder = t('situations.' + state.situation + '.placeholder');
  }

  function updateCounter() {
    var length = el.topic.value.length;
    var atLimit = length >= MAX_LENGTH;
    el.topicCountValue.textContent = String(length);
    el.topicCount.classList.toggle('is-limit', atLimit);
    if (atLimit && !state.limitAnnounced) announce(t('ui.limitReached'));
    state.limitAnnounced = atLimit;
  }

  function syncPills(inputs) {
    inputs.forEach(function (input) {
      var pill = input.closest('.pill');
      if (pill) pill.classList.toggle('is-selected', input.checked);
    });
  }

  function setSituation(value) {
    if (SITUATIONS.indexOf(value) === -1) return;
    var previous = state.situation;
    state.situation = value;
    el.situationInputs.forEach(function (input) { input.checked = input.value === value; });
    syncPills(el.situationInputs);
    updatePlaceholder();
    if (previous !== value && state.autoFilledTopic && el.topic.value === state.autoFilledTopic) {
      el.topic.value = '';
      state.autoFilledTopic = '';
      updateCounter();
    }
  }

  function setTone(value) {
    if (TONES.indexOf(value) === -1) return;
    state.tone = value;
    el.toneInputs.forEach(function (input) { input.checked = input.value === value; });
    syncPills(el.toneInputs);
  }

  /* ---------- Genereren ---------- */
  function chooseThree(bank) {
    var count = Math.min(3, bank.length);
    var chosen = [];
    for (var attempt = 0; attempt < 12; attempt++) {
      chosen = shuffledIndexes(bank.length).slice(0, count);
      if (bank.length <= 3 || !sameSet(chosen, state.lastIndexes)) break;
    }
    state.lastIndexes = chosen;
    return chosen.map(function (index) { return bank[index]; });
  }

  function generate(options) {
    options = options || {};
    var content = contentFor(state.lang);
    var bank = content && content.phrases && content.phrases[state.situation] ? content.phrases[state.situation][state.tone] : null;
    if (!bank || !bank.length) {
      showContentMissing();
      return;
    }
    var topic = cleanTopic(el.topic.value);
    var picked = chooseThree(bank);
    state.results = picked.map(function (phrase) {
      var text = topic ? fillTemplate(phrase.topic, topic, state.lang) : phrase.generic;
      return { text: text, situation: state.situation, tone: state.tone, lang: state.lang };
    });
    var headingKey = options.headingKey || (state.hasGenerated ? 'ui.resultsNew' : 'ui.resultsFirst');
    state.hasGenerated = true;
    state.headingKey = headingKey;
    if (!options.keepNote) state.surpriseNote = '';
    renderResults();
    var situationLabel = t('situations.' + state.situation + '.label');
    var toneLabel = t('tones.' + state.tone + '.label');
    announce(t('ui.announceResults', { heading: t(headingKey), situation: situationLabel, tone: toneLabel }));
    if (options.scroll !== false) revealResults();
  }

  function showContentMissing() {
    state.results = [];
    state.surpriseNote = '';
    el.resultsHeading.textContent = t('ui.resultsEmptyHeading');
    el.resultsSub.hidden = true;
    el.resultsNote.hidden = true;
    el.resultsList.hidden = true;
    while (el.resultsList.firstChild) el.resultsList.removeChild(el.resultsList.firstChild);
    el.resultsEmpty.hidden = false;
    el.resultsEmpty.querySelector('p').textContent = t('ui.contentMissing');
  }

  function renderResults() {
    var situationLabel = t('situations.' + state.situation + '.label');
    var toneLabel = t('tones.' + state.tone + '.label');
    el.resultsHeading.textContent = t(state.headingKey || 'ui.resultsFirst');
    el.resultsSub.textContent = t('ui.resultsSub', { situation: situationLabel, tone: toneLabel });
    el.resultsSub.hidden = false;
    if (state.surpriseNote) {
      el.resultsNote.textContent = state.surpriseNote;
      el.resultsNote.hidden = false;
    } else {
      el.resultsNote.textContent = '';
      el.resultsNote.hidden = true;
    }
    el.resultsEmpty.hidden = true;
    el.resultsList.hidden = false;
    while (el.resultsList.firstChild) el.resultsList.removeChild(el.resultsList.firstChild);
    state.results.forEach(function (item, index) {
      el.resultsList.appendChild(buildCard(item, 'result-' + index, false));
    });
  }

  function revealResults() {
    var rect = el.results.getBoundingClientRect();
    var fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    try { el.resultsHeading.focus({ preventScroll: true }); } catch (error) { el.resultsHeading.focus(); }
    if (!fullyVisible) {
      el.resultsHeading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function surprise() {
    var content = contentFor(state.lang);
    if (!content) { generate(); return; }
    var pairs = [];
    SITUATIONS.forEach(function (situation) {
      TONES.forEach(function (tone) {
        if (situation !== state.situation || tone !== state.tone) pairs.push([situation, tone]);
      });
    });
    var pair = pairs[randomInt(pairs.length)];
    setSituation(pair[0]);
    setTone(pair[1]);
    var example = pick(content.examples[pair[0]] || [], state.lastExample);
    if (example) {
      el.topic.value = example;
      state.autoFilledTopic = example;
      state.lastExample = example;
    }
    updatePlaceholder();
    updateCounter();
    state.surpriseNote = t('ui.surpriseNote');
    generate({ headingKey: 'ui.resultsNew', keepNote: true });
  }

  /* ---------- Kaarten ---------- */
  function buildCard(item, idPrefix, isSavedCard) {
    var fragment = el.cardTemplate.content.cloneNode(true);
    var card = fragment.querySelector('.card');
    var text = fragment.querySelector('.card__text');
    var copyButton = fragment.querySelector('.card__copy');
    var copyLabel = fragment.querySelector('.card__copy-label');
    var saveButton = fragment.querySelector('.card__save');
    var removeButton = fragment.querySelector('.card__remove');
    var removeLabel = fragment.querySelector('.card__remove-label');
    var textId = idPrefix + '-text';

    text.id = textId;
    text.textContent = item.text;
    text.lang = item.lang;
    copyLabel.textContent = t('ui.copy');
    copyButton.setAttribute('aria-describedby', textId);
    copyButton.addEventListener('click', function () { copyText(item.text); });

    if (isSavedCard) {
      card.classList.add('card--saved');
      saveButton.hidden = true;
      removeButton.hidden = false;
      removeLabel.textContent = t('ui.remove');
      removeButton.setAttribute('aria-describedby', textId);
      removeButton.addEventListener('click', function () { removeSaved(item.id, removeButton); });
    } else {
      var saved = findSaved(item.text, item.lang) !== -1;
      saveButton.setAttribute('aria-pressed', saved ? 'true' : 'false');
      saveButton.setAttribute('aria-label', t('ui.save'));
      saveButton.setAttribute('aria-describedby', textId);
      saveButton.addEventListener('click', function () { toggleSave(item); });
    }
    return fragment;
  }

  function copyText(text) {
    var done = function (ok) { showToast(ok ? t('ui.copied') : t('ui.copyFailed')); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(copyFallback(text)); });
      return;
    }
    done(copyFallback(text));
  }

  function copyFallback(text) {
    var previous = document.activeElement;
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.setAttribute('aria-hidden', 'true');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.left = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    document.body.removeChild(area);
    if (previous && typeof previous.focus === 'function') {
      try { previous.focus({ preventScroll: true }); } catch (error) { previous.focus(); }
    }
    return ok;
  }

  /* ---------- Bewaren ---------- */
  function toggleSave(item) {
    var index = findSaved(item.text, item.lang);
    if (index === -1) {
      state.saved.unshift({
        id: newId(),
        text: item.text,
        lang: item.lang,
        situation: item.situation,
        tone: item.tone,
        createdAt: Date.now()
      });
      showToast(t('ui.savedToast'), t('ui.savedAnnounce', { n: state.saved.length }));
    } else {
      state.saved.splice(index, 1);
      showToast(t('ui.removedToast'), t('ui.removedAnnounce', { n: state.saved.length }));
    }
    persistSaved();
    updateSavedCount();
    renderSaved();
    syncResultHearts();
  }

  function removeSaved(id, button) {
    var index = -1;
    for (var i = 0; i < state.saved.length; i++) if (state.saved[i].id === id) { index = i; break; }
    if (index === -1) return;
    state.saved.splice(index, 1);
    persistSaved();
    updateSavedCount();
    renderSaved();
    syncResultHearts();
    showToast(t('ui.removedToast'), t('ui.removedAnnounce', { n: state.saved.length }));
    var next = el.savedList.querySelector('.card__remove') || el.savedHeading;
    if (next && button && document.activeElement === document.body) {
      try { next.focus({ preventScroll: true }); } catch (error) { next.focus(); }
    }
  }

  function syncResultHearts() {
    Array.prototype.forEach.call(el.resultsList.querySelectorAll('.card'), function (card, index) {
      var item = state.results[index];
      var button = card.querySelector('.card__save');
      if (!item || !button) return;
      var saved = findSaved(item.text, item.lang) !== -1;
      button.setAttribute('aria-pressed', saved ? 'true' : 'false');
      button.setAttribute('aria-label', t('ui.save'));
    });
  }

  function updateSavedCount() {
    var count = state.saved.length;
    el.savedBadge.textContent = String(count);
    el.savedCount.textContent = String(count);
    el.savedToggle.setAttribute('aria-label', t('ui.savedButtonAria', { n: count }));
  }

  function renderSaved() {
    while (el.savedList.firstChild) el.savedList.removeChild(el.savedList.firstChild);
    if (!state.saved.length) {
      el.savedEmpty.hidden = false;
      el.savedList.hidden = true;
      return;
    }
    el.savedEmpty.hidden = true;
    el.savedList.hidden = false;
    state.saved.forEach(function (item) {
      el.savedList.appendChild(buildCard(item, 'saved-' + item.id, true));
    });
  }

  function toggleSavedSection(open) {
    var willOpen = typeof open === 'boolean' ? open : el.savedSection.hidden;
    el.savedSection.hidden = !willOpen;
    el.savedToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (willOpen) {
      try { el.savedHeading.focus({ preventScroll: true }); } catch (error) { el.savedHeading.focus(); }
      el.savedHeading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    } else {
      try { el.savedToggle.focus({ preventScroll: true }); } catch (error) { el.savedToggle.focus(); }
    }
  }

  /* ---------- Gebeurtenissen ---------- */
  el.langButtons.forEach(function (button) {
    button.addEventListener('click', function () { setLanguage(button.getAttribute('data-lang'), true); });
  });

  el.situationInputs.forEach(function (input) {
    input.addEventListener('change', function () { if (input.checked) setSituation(input.value); });
  });

  el.toneInputs.forEach(function (input) {
    input.addEventListener('change', function () { if (input.checked) setTone(input.value); });
  });

  el.topic.addEventListener('input', function () {
    if (el.topic.value.length > MAX_LENGTH) el.topic.value = el.topic.value.slice(0, MAX_LENGTH);
    if (state.autoFilledTopic && el.topic.value !== state.autoFilledTopic) state.autoFilledTopic = '';
    updateCounter();
  });

  el.topic.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      generate();
    }
  });

  el.form.addEventListener('submit', function (event) {
    event.preventDefault();
    generate();
  });

  el.surprise.addEventListener('click', surprise);
  el.savedToggle.addEventListener('click', function () { toggleSavedSection(); });
  el.savedClose.addEventListener('click', function () { toggleSavedSection(false); });

  /* ---------- Start ---------- */
  state.lang = loadLang();
  state.saved = loadSaved();
  syncPills(el.situationInputs);
  syncPills(el.toneInputs);
  applyLanguage();
  updateCounter();
  if (!contentFor(state.lang) || !contentFor(state.lang).phrases) {
    showContentMissing();
    el.generate.disabled = true;
    el.surprise.disabled = true;
  }
})();
