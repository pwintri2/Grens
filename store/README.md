# Grens — build- en publicatiedossier

Stand van de eisen: **8 oktober 2026**. Dit dossier is voorbereid voor een Tauri 2-app voor de Mac App Store, de iPhone App Store en Google Play.

> **Geen upload of publicatie.** De opdrachten hieronder bouwen of controleren uitsluitend lokale artefacten. Upload niets naar App Store Connect, TestFlight, Google Play (ook niet naar een testtrack) of een andere externe dienst zonder een nieuwe, expliciete goedkeuring van de eigenaar. Klik evenmin op **Submit for Review**, **Publish**, **Roll out** of een vergelijkbare knop.

## Wat al in dit dossier staat

- `metadata/nl-NL.json` en `metadata/en-US.json`: tweetalige storetekst.
- `assets/app-icon-512.png`: dekkend 512×512 store-icoon.
- `assets/feature-graphic.png` en `assets/feature-graphic-en.png`: dekkende 1024×500 Google Play-graphics voor NL en EN; de SVG-bestanden zijn de bewerkbare bronnen.
- `../privacy.html` en `../privacy.css`: zelfstandige tweetalige privacyverklaring zonder scripts of externe/remote bronnen.
- Voorgestelde categorie: **Lifestyle**.
- Voorgestelde support-URL: `https://philip-wintrip.com/`.
- Beoogde privacy-URL na afzonderlijke webpublicatie: `https://philip-wintrip.com/grens/privacy.html`.

De JSON-velden zijn bedoeld als bronkopie, niet als rechtstreeks importformaat voor Apple of Google. `subtitle` is voor Apple; `shortDescription` voor Google. `fullDescription` past in beide stores.

De schermafbeeldingen in `../docs/` documenteren de webapp en zijn **geen definitieve store-screenshots**. Maak na de echte release-apparaattests afzonderlijke, gelokaliseerde iPhone-, Mac- en Android-screenshots op de dan geldige storeformaten.

## Metadata-limieten

| Veld | Apple App Store | Google Play | Dossier |
| --- | ---: | ---: | --- |
| Naam | 2–30 tekens | maximaal 30 tekens | `name` |
| Subtitel | maximaal 30 tekens | — | `subtitle` |
| Korte beschrijving | — | maximaal 80 tekens | `shortDescription` |
| Beschrijving | maximaal 4.000 tekens | maximaal 4.000 tekens | `fullDescription` |
| Keywords | maximaal 100 bytes | geen apart veld | `keywords` |

Apple verlangt dat de support-URL naar echte contactinformatie leidt. **[EIGENAAR: controleer vóór indiening dat de gekozen supportpagina voldoende actuele contactinformatie toont.]** De privacy-URL is pas bruikbaar nadat `privacy.html` daadwerkelijk op die HTTPS-URL staat en zonder login een `200`-respons geeft.

## A. Technisch build-ready

Een vinkje betekent dat het punt tegen de definitieve release-build is gecontroleerd, niet alleen tegen de webversie of een debugbuild.

### Alle platformen

- [ ] De Tauri-versie en alle dependencyversies zijn vastgelegd; een schone installatie en de bestaande opslag- en browsertests slagen.
- [ ] `name`, zichtbare productnaam, bundle/package identifiers en semantische versie zijn op alle platformen consistent.
- [ ] Alle HTML, CSS, JavaScript, zinnen en fonts worden lokaal meegeleverd; er worden geen CDN's, remote fonts, analytics, advertenties of externe SDK's geladen.
- [ ] De definitieve capabilities en permissies zijn minimaal. Er is geen shell-, updater-, HTTP- of algemene bestandssysteemtoegang toegevoegd.
- [ ] Een inspectie van de definitieve binaries en runtime bevestigt de privacytekst: geen account, backend, tracking of netwerkverzoeken.
- [ ] Opslaan, herstarten, kopiëren, importeren en expliciet exporteren werken op een echt apparaat. Een geannuleerde bestandskeuze wijzigt niets.
- [ ] Wissen is gecontroleerd: losse items in de app, alle appdata via het besturingssysteem en volledige deïnstallatie.
- [ ] NL/EN, schermlezer, toetsenbordnavigatie, tekstvergroting, hoog contrast, kleine schermen, veilige schermranden en het schermtoetsenbord zijn gecontroleerd.
- [ ] Geen certificaat, provisioning profile, API-sleutel, keystore, wachtwoord of privésleutel staat in Git.
- [ ] De definitieve iconen zijn origineel/rechthebbend, leesbaar op alle formaten en bevatten geen transparantie waar de store dat verbiedt.

### macOS — Mac App Store

Alle macOS-App-Store-builds worden op macOS met Xcode en de Apple toolchain gemaakt.

- [ ] **[EIGENAAR: `APPLE_TEAM_ID`]**, **[EIGENAAR: definitieve bundle ID]** en een actief Apple Developer Program-lidmaatschap zijn beschikbaar.
- [ ] De Tauri-bundlecategorie is `Lifestyle` en de definitieve minimum-macOS-versie is bewust gekozen en getest.
- [ ] Het App ID exact gelijk is aan de Tauri-identifier; een **Mac App Store Connect** provisioning profile is in de appbundle opgenomen.
- [ ] De app is ondertekend met een geldige **Apple Distribution**-identiteit; de `.pkg` met een **Mac Installer Distribution**-identiteit.
- [ ] App Sandbox staat aan. Entitlements bevatten de Team ID en application identifier, plus uitsluitend noodzakelijke user-selected file read/write-toegang voor import/export.
- [ ] App ID Prefix en Team ID zijn uit het provisioning profile gecontroleerd. Zet `APPLE_APP_ID_PREFIX` afzonderlijk als een ouder account een andere prefix dan de Team ID gebruikt.
- [ ] `ITSAppUsesNonExemptEncryption` is na inspectie van app én dependencies waarheidsgetrouw gezet.
- [ ] De app werkt volledig in App Sandbox: lokale opslag, klembord, import/export, vensterherstel en verwijderen van appdata.
- [ ] Zowel Apple Silicon als Intel is lokaal getest als een universal binary wordt aangeboden; anders zijn architectuur en minimumversie bewust beperkt.

Maak eerst de lokale, door Git genegeerde sandboxconfiguratie met het profiel van de eigenaar en gebruik die configuratie daarna expliciet voor de build:

```bash
APPLE_TEAM_ID="ABCDEFGHIJ" \
MACOS_PROVISIONING_PROFILE="/beveiligd/pad/Grens.provisionprofile" \
pnpm store:apple:prepare

pnpm tauri build --no-bundle --target universal-apple-darwin

APPLE_SIGNING_IDENTITY="Apple Distribution: NAAM (ABCDEFGHIJ)" \
pnpm tauri bundle \
  --bundles app \
  --target universal-apple-darwin \
  --config src-tauri/generated/tauri.appstore.conf.json

xcrun productbuild \
  --sign "Mac Installer Distribution: NAAM (ABCDEFGHIJ)" \
  --component "src-tauri/target/universal-apple-darwin/release/bundle/macos/Grens.app" /Applications \
  "Grens.pkg"
```

Controleer daarna ten minste de app- en pakkethandtekening:

```bash
codesign --verify --deep --strict --verbose=2 path/to/Grens.app
pkgutil --check-signature path/to/Grens.pkg
```

- [ ] De `.app` start op een schone test-Mac en de lokale `.pkg` installeert en verwijdert correct.
- [ ] De distributieartefacten, entitlements, provisioning profile en handtekeningen zijn apart vastgelegd in het testrapport.

### iPhone — App Store

Sinds 28 april 2026 moeten iOS-uploads volgens Apple met **Xcode 26 of nieuwer** en de **iOS 26 SDK of nieuwer** zijn gebouwd. Controleer de eis opnieuw op de dag van indiening.

- [ ] Een actuele volledige Xcode-installatie, CocoaPods en de Rust-targets `aarch64-apple-ios`, `aarch64-apple-ios-sim` en `x86_64-apple-ios` zijn op de build-Mac beschikbaar.
- [ ] Het gegenereerde Xcode-project heeft de definitieve **[EIGENAAR: bundle ID]**, **[EIGENAAR: Apple Team]**, versie/buildnummer, deployment target en uitsluitend iPhone-devicefamilies — of iPad is ook volledig getest en ondersteund.
- [ ] Automatische of handmatige signing levert een geldige Apple Distribution-build en passend provisioning profile op.
- [ ] App-iconen, launch-weergave, displaynaam en NL/EN-localisatie zijn op een echte iPhone gecontroleerd.
- [ ] De app vraagt geen camera-, microfoon-, locatie-, contacten-, tracking- of notificatiepermissies; ongebruikte usage-description-sleutels ontbreken.
- [ ] `PrivacyInfo.xcprivacy`, de redenen `C617.1` (appcontainer) en `3B52.1` (door de gebruiker gekozen bestand), required-reason API-gebruik en eventuele SDK-privacy manifests zijn op de definitieve archive gecontroleerd.
- [ ] In de uitgepakte IPA staat `PrivacyInfo.xcprivacy` exact op `Payload/Grens.app/PrivacyInfo.xcprivacy`, niet alleen onder `assets/`. De door `pnpm ios:init` aangepaste `project.yml` borgt dit in de projectbron; de archive blijft het beslissende bewijs.
- [ ] Lokale opslag overleeft normaal afsluiten/herstarten; import/export via de systeemkiezer of sharesheet en klembord werken op een echte iPhone.
- [ ] De layout werkt met Dynamic Type/tekstvergroting, VoiceOver, schermtoetsenbord, veilige schermranden en ondersteunde oriëntaties.

Lokale App Store Connect-build, zonder upload:

```bash
pnpm tauri ios build --export-method app-store-connect
```

Inspecteer daarna de IPA zonder iets te uploaden:

```bash
unzip -l src-tauri/gen/apple/build/arm64/Grens.ipa
```

- [ ] De resulterende `.ipa` is lokaal geïnspecteerd, correct ondertekend en met de bedoelde provisioning profile geëxporteerd.
- [ ] Een Release-build is op een echt toestel getest; debuggedrag geldt niet als bewijs.

### Android — Google Play

Sinds 31 augustus 2026 moeten nieuwe telefoon/tablet-apps en updates voor Google Play **Android 16 / target API 36 of hoger** gebruiken. Tauri 2 ondersteunt minimaal Android 7 / API 24; verhoog `minSdkVersion` alleen bewust.

- [ ] Android Studio/JDK, SDK Platform 36+, Build Tools, platform-tools, command-line tools en een ondersteunde NDK-versie zijn vastgelegd.
- [ ] De Rust-targets `aarch64-linux-android`, `armv7-linux-androideabi`, `i686-linux-android` en `x86_64-linux-android` zijn beschikbaar.
- [ ] **[EIGENAAR: definitieve package name]**, `versionName` en een uniek oplopende `versionCode` zijn vastgelegd. De package name is na de eerste Play-upload niet meer vrij wijzigbaar.
- [ ] De releasebuild gebruikt een aparte upload key; keystore, properties en wachtwoorden staan buiten de repository en hebben een herstelbare, beveiligde back-up.
- [ ] Na `pnpm android:init` bevat `app/build.gradle.kts` de automatisch toegevoegde `release` signingConfig. `pnpm android:build` controleert eerst het genegeerde `keystore.properties` en weigert zonder leesbare keystore.
- [ ] Het definitief samengevoegde `AndroidManifest.xml` bevat geen onnodige permissies. In het bijzonder is netwerktoegang afwezig als de app die niet gebruikt.
- [ ] Het release-manifest bevat geen `INTERNET`, `android.software.leanback` of `LEANBACK_LAUNCHER`; internet staat alleen in het debug-manifest voor de lokale ontwikkelserver. `pnpm android:init` past dit automatisch toe.
- [ ] Alle 64-bit native libraries zijn getest op 16 KB page-size-apparaten. Google Play vereist dit voor apps die API 35+ targeten; de handhaving voor niet-compatibele updates begint volgens de huidige planning op 1 februari 2027.
- [ ] Rand-tot-randweergave, systeemterugknop/-gebaar, toetsenbord, bestandenkiezer, klembord en wissen via **Instellingen → Apps → Grens → Opslag → Gegevens wissen** werken.
- [ ] Een release-AAB is lokaal met `bundletool` gevalideerd en de daaruit gegenereerde device-APK's zijn op ARM64 en minimaal één andere relevante configuratie getest.

Maak de upload key eenmalig buiten de repository; `keytool` vraagt de geheime waarden interactief:

```bash
keytool -genkey -v \
  -keystore /beveiligd/pad/grens-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Zet daarna `ANDROID_KEYSTORE_PATH`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` en desgewenst een apart `ANDROID_STORE_PASSWORD` via een beveiligde lokale secretsmethode. De volgende stap schrijft ze met bestandsmodus 0600 naar het door Git genegeerde `src-tauri/gen/android/keystore.properties` en toont de waarden niet:

```bash
pnpm store:android:prepare
```

Lokale signed Android App Bundle, zonder upload:

```bash
pnpm android:build
```

- [ ] Het AAB is met de bedoelde upload key ondertekend; certificaatfingerprint, grootte, ABI's, target/min SDK en permissies staan in het testrapport.

## B. Publicatie-ready — eigenaar en stores

Deze punten vereisen accounts, juridische verklaringen, contactgegevens of externe handelingen. Ze zijn bewust niet automatisch ingevuld of uitgevoerd.

### Eerst voor alle stores

- [ ] **[EIGENAAR: rechthebbende naam]** en **[EIGENAAR: copyrightjaar]** zijn vastgesteld; er is geen verzonnen juridische entiteit gebruikt.
- [ ] De eigenaar bevestigt de rechten op appnaam, teksten, screenshots, iconen en overige assets.
- [ ] `privacy.html` is afzonderlijk gepubliceerd op `https://philip-wintrip.com/grens/privacy.html`, publiek bereikbaar via HTTPS en woordelijk gelijk aan de definitieve appwerking.
- [ ] De supportpagina is bereikbaar en bevat actuele, wettelijk toereikende contactinformatie. Voeg geen verzonnen e-mailadres toe.
- [ ] **[EIGENAAR: prijs]**, **[EIGENAAR: landen/regio's]**, **[EIGENAAR: doelgroep]** en **[EIGENAAR: gewenste releasedatum/-methode]** zijn gekozen.
- [ ] Definitieve, gelokaliseerde screenshots tonen alleen echte Release-buildfunctionaliteit; statusbalken en persoonlijke tekst zijn opgeschoond.
- [ ] Privacy-, export-compliance-, leeftijds-, doelgroep- en contentverklaringen zijn na inspectie van de definitieve binaries beantwoord.
- [ ] Store-overeenkomsten, identiteit/handelaarstatus, belasting en bankgegevens zijn door de eigenaar afgehandeld waar vereist.

### App Store Connect — macOS en iPhone

- [ ] **[EIGENAAR: App Store Connect SKU]**, bundle ID(s), primaire taal en platformrecords zijn definitief; controleer of macOS en iOS één multi-platformrecord of bewust aparte records krijgen.
- [ ] Naam, subtitel, beschrijving, keywords, categorie, support-URL en privacy-URL uit beide JSON-bestanden zijn per locale ingevoerd en nagelezen.
- [ ] Correcte Mac- en iPhone-screenshots zijn toegevoegd volgens de actuele App Store Connect-specificaties.
- [ ] Het actuele leeftijdsvragenformulier is inhoudelijk ingevuld; de uitkomst is niet vooraf geraden.
- [ ] App Privacy staat alleen op **Data Not Collected** als de definitieve binary, plugins en SDK's dat bevestigen.
- [ ] Export compliance is waarheidsgetrouw ingevuld en komt overeen met `ITSAppUsesNonExemptEncryption`.
- [ ] **[EIGENAAR: review-contactnaam]**, **[EIGENAAR: review-e-mailadres]** en **[EIGENAAR: telefoon in internationaal formaat]** zijn ingevuld. Geen demoaccount nodig zolang Grens geen login heeft.
- [ ] Review Notes leggen kort uit dat alles lokaal werkt, waar import/export staat en hoe appdata wordt gewist.
- [ ] Copyright is ingevuld als **[EIGENAAR: JAAR RECHTHEBBENDE]**; prijs, beschikbaarheid, DSA/handelaarstatus en contentrechten zijn bevestigd.
- [ ] De release staat bij voorkeur eerst op **Manual release**, zodat goedkeuring niet automatisch live publiceert.
- [ ] Pas na aparte expliciete toestemming: build uploaden, TestFlight starten, aan review toevoegen, indienen en uiteindelijk vrijgeven.

### Google Play Console — Android

- [ ] Developer-account, developer verification en betaalprofiel zijn door de eigenaar afgerond.
- [ ] Naam, korte en volledige beschrijving uit beide JSON-bestanden zijn per locale ingevoerd; categorie **Lifestyle** en passende tags zijn door de eigenaar bevestigd.
- [ ] 512×512 app-icon, 1024×500 feature graphic, telefoon-screenshots en eventuele tabletassets zijn echt, actueel en gelokaliseerd.
- [ ] **[EIGENAAR: openbaar Play-support-e-mailadres]** is ingevuld. Google verlangt een contact-e-mailadres; dit dossier verzint er geen.
- [ ] Privacy policy verwijst naar de live privacy-URL. Data safety verklaart alleen **geen gegevens verzameld of gedeeld** nadat ook alle libraries en permissies zijn gecontroleerd.
- [ ] Ads = nee, app access = alle functies zonder login, en target audience/content zijn door de eigenaar bevestigd.
- [ ] Het IARC-contentratingformulier en alle actuele App content-declaraties zijn volledig en naar waarheid ingevuld.
- [ ] Play App Signing en de upload key zijn ingericht; certificate fingerprints en herstelprocedure zijn veilig vastgelegd.
- [ ] De productieversie target API 36+ en de Play pre-launch report, automatische device-tests en policy-waarschuwingen zijn zonder open blokkades beoordeeld.
- [ ] Voor een persoonlijk developer-account dat na 13 november 2023 is gemaakt: gesloten test met minimaal 12 continu ingeschreven testers gedurende 14 aaneengesloten dagen, gevolgd door de aanvraag voor production access.
- [ ] Landen/regio's, prijs, release notes en staged rollout/volledige rollout zijn bewust gekozen.
- [ ] Pas na aparte expliciete toestemming: AAB naar een track uploaden, Data safety indienen, production access aanvragen, review starten of uitrollen.

## Niet in Git zetten

- Apple `.p8` API keys, `.p12` certificaten en wachtwoorden.
- Provisioning profiles die persoonsgegevens of accountdetails bevatten, tenzij de eigenaar daar bewust een beveiligde private opslag voor heeft gekozen.
- Android `.jks`/`.keystore`, `keystore.properties`, key aliases en wachtwoorden.
- App Store Connect-, Play Console- of CI-tokens en sessies.
- Review-contactgegevens voordat de eigenaar expliciet heeft besloten dat ze in deze repository mogen staan.

## Officiële bronnen

Controleer deze bronnen opnieuw vlak voor indiening; store-eisen veranderen:

- Tauri 2: [prerequisites](https://v2.tauri.app/start/prerequisites/), [App Store](https://v2.tauri.app/distribute/app-store/), [iOS signing](https://v2.tauri.app/distribute/sign/ios/), [Android signing](https://v2.tauri.app/distribute/sign/android/) en [Google Play](https://v2.tauri.app/distribute/google-play/).
- Apple: [app information en veldlimieten](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information), [platformmetadata](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information), [app privacy](https://developer.apple.com/help/app-store-connect/reference/app-information/app-privacy) en [SDK-minimumeisen](https://developer.apple.com/news/upcoming-requirements/).
- Google Play: [store listing en veldlimieten](https://support.google.com/googleplay/android-developer/answer/9859152), [target API-eisen](https://support.google.com/googleplay/android-developer/answer/11926878), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [persoonlijke-accounttests](https://support.google.com/googleplay/android-developer/answer/14151465) en [16 KB page sizes](https://developer.android.com/guide/practices/page-sizes).

## Stopgrens

Een succesvolle lokale `.app`, `.pkg`, `.ipa` of `.aab` is **build-ready**, niet gepubliceerd. Storemetadata, een geüploade build, TestFlight, een Play-testtrack, reviewgoedkeuring en live beschikbaarheid zijn elk afzonderlijke toestanden. Rapporteer uitsluitend wat aantoonbaar is en vraag vóór iedere externe upload of indiening opnieuw om expliciete toestemming.
