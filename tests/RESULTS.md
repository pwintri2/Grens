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

---

# Native verpakkingscontrole

Uitgevoerd op 8 oktober 2026 op Linux met Node.js 22.22.2, pnpm 10.33.2, Rust/Cargo 1.95.0 en Tauri 2.12.1.

## Resultaat

- 18/18 Node-tests geslaagd: 11 opslagtests, 3 tests voor de native brug en 4 regressietests voor mobiele projectaanpassingen en veilige Android-signing.
- 49/49 browseracceptatiechecks geslaagd, inclusief offlinegebruik, 320px-layouts, toegankelijkheidsnamen, import/export, de lokale privacy-pagina en nul externe verzoeken.
- `pnpm build`, `pnpm run check:store` (11/11), `cargo check` en `pnpm tauri build --debug --no-bundle` geslaagd.
- De debug-desktopbinary is gebouwd in `src-tauri/target/debug/grens`.
- App-iconen voor desktop, iOS en Android zijn uit één originele 1024px-bron gegenereerd; de dekkende Google Play PNG's (icoon en NL/EN feature graphics) hebben de vereiste pixelafmetingen.

## Grenzen

- De definitieve macOS- en iPhone-builds zijn niet op Linux te maken of te ondertekenen; daarvoor zijn een Mac, een actuele Xcode-installatie, Apple Developer-toegang, certificaten, provisioning profiles en echte-apparaattests nodig.
- De Android SDK/NDK en Android Studio zijn op deze computer niet aanwezig. `tauri android init` stopt daarom aantoonbaar op de ontbrekende SDK. SDK-licenties en een signing key zijn niet namens de eigenaar aangemaakt of geaccepteerd.
- De nog te genereren `src-tauri/gen/android`- en `src-tauri/gen/apple`-projectbron wordt bewust niet als geheel genegeerd: genereer, inspecteer en commit deze op de juiste buildmachines; alleen schema's, builds, lokale SDK-paden en signingmateriaal blijven buiten Git.
- `pnpm check:release` faalt daarom nu bewust op precies deze twee ontbrekende platformprojecten (11/13 controles slagen). Na `pnpm android:init` en `pnpm ios:init` controleert dit commando ook target SDK, manifestrechten, iPhone-devicefamilie en de iOS privacyresource.
- Er is geen build, metadata of privacyverklaring naar Apple, TestFlight, Google Play of een website geüpload. Store-indiening blijft een afzonderlijke, expliciet goed te keuren stap.
