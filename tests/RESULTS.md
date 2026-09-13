# Testresultaten · Grens uitbreiding Plan2

Uitgevoerd op 13 september 2026 op macOS, Node.js 26.7.0 en Chrome 151.0.7922.176.

## Resultaat

- 11/11 opslagtests geslaagd (`node --test tests/storage.test.cjs`).
- 47/47 browseracceptatiechecks geslaagd (`node tests/browser.mjs`).
- JavaScript-syntaxcontrole en `git diff --check` geslaagd.
- Mijn zinnen en Mijn dagritme visueel gecontroleerd op 320 px: leesbare labels, zichtbare focus, geen horizontale overflow in NL/EN.

## Opslagtests

Behoud van bestaande keys; herladen; datumgebonden afvinken; expliciet leeg ritme; validatie en letterlijke XSS-tekst; bescherming van corrupte/onbekende opslag; export/import; deduplicatie en ID-remapping; limieten; schrijfconflicten; rollback bij quota-fouten en melding bij mislukte rollback; NL/EN-voorbeelden zonder dubbele import; behoud van aangepaste tekst bij ongeldige voorbeeldmarkers.

## Browserchecks

- Three default recurring moments
- Existing saved phrases remain available
- Original phrase generator remains functional
- Keyboard opens custom form and focuses text
- Keyboard Tab reaches category
- Cancel returns keyboard focus to add button
- Empty custom phrase rejected accessibly
- XSS-like phrase displayed as literal text
- Copy receives exact custom text
- Custom phrase and favorite persist across reload
- Language switch translates UI and preserves edit state
- Editing updates existing phrase
- Search ignores case
- Category and tone filters combine
- Favorites filter shows only favorites
- Custom delete works
- Daily overview sorts moments by time
- Completion persists for its calendar date
- Completion does not leak into another date
- Monday-only moments absent on Tuesday
- Disabling removes item from daily overview
- Editing time reorders daily overview
- Linked recurring moment follows phrase edits
- Deleting linked phrase preserves last moment text
- Recurring delete removes both views
- Reimport skips duplicates
- Invalid import leaves collections intact: {broken
- Invalid import leaves collections intact: null
- Invalid import leaves collections intact: {}
- Invalid import leaves collections intact: {"version":999,"custom":[],"schedule":[]}
- Export restores custom data after a fresh start
- Import keeps existing saved storage untouched
- 320px English layout has no horizontal overflow
- 320px Dutch layout has no horizontal overflow
- Keyboard traversal reaches all new sections and backup controls without a focus trap
- Chrome accessibility tree gives every interactive control a name
- All form controls have programmatic labels
- Offline file reload loads original and new functionality
- No notification permission requested
- Unreadable storage is preserved and explained: {"version":99,"items":[]}
- Saving cannot replace unreadable storage: {"version":99,"items":[]}
- Unreadable storage is preserved and explained: {broken
- Saving cannot replace unreadable storage: {broken
- Custom edits work with unrelated corrupt schedule
- Custom delete works with unrelated corrupt schedule
- Application sends no external requests
- No browser JavaScript exceptions

## Grenzen en vervolgstappen

- Offline is getest door de gedownloade app via `file://` te openen en met uitgeschakeld netwerk te herladen. Herladen van de gehoste site zonder netwerk is niet gegarandeerd: de app heeft geen service worker.
- Toetsenbordbediening en de native toegankelijkheidsboom van Chrome zijn getest. Dit vervangt geen volledige handmatige VoiceOver- of andere schermlezeraudit. Safari/Firefox zijn niet afzonderlijk getest.
- Kopieerlogica is met een gecontroleerde clipboard-stub op exacte tekst getest; beschikbare clipboardrechten kunnen per browser verschillen. Er is een selecteerbare-tekstfallback met foutmelding.
- Testgegevens staan uitsluitend in geïsoleerde tijdelijke browserprofielen; de persoonlijke browseropslag van de gebruiker is niet benaderd.
- De uitbreiding houdt vanilla HTML/CSS/JavaScript en lokale opslag. Geen notificaties, agenda-export, account, backend, analytics of externe API toegevoegd.
- Geen openstaande implementatiekeuzes voor het eerste deel van Plan2. Eventuele agenda-export/notificaties uit de toelichting zijn vervolgwerk.
- De bestanden worden in Google Drive bijgewerkt. Publicatie op de bestaande externe webhost is een aparte stap via de uploadinstructies in README.md.
