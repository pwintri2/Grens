# Grens · Nee-zegger Script Generator

**Live:** [philip-wintrip.com/grens](https://philip-wintrip.com/grens) · Nederlands en English

Een rustige, vriendelijke webapp die korte zinnen geeft om appjes, verzoeken of afspraken af te wijzen, zonder uitgebreide uitleg en zonder schuldgevoel. Voor mensen met een burn-out, overprikkeling of gewoon behoefte aan rust.

*Een nee mag ook een hele zin zijn.*

![De Nee-zegger Script Generator: situatie Familie, toon Warm, drie zinnen met een hartje om te bewaren](docs/screenshot-nl.png)

[English version below](#grens--no-sayer-script-generator-english)

## Wat doet het?

1. Kies een **situatie**: Werk, Sociaal, Familie of Afspraak.
2. Typ eventueel kort **waar het verzoek over gaat** (max. 140 tekens). Mag ook leeg blijven.
3. Kies een **toon**: Warm, Kort of Duidelijk.
4. Druk op **Geef me woorden**. Je krijgt drie verschillende zinnen, met jouw tekst er natuurlijk in verwerkt.
5. **Kopieer** een zin naar je klembord, of **bewaar** hem met het hartje. Bewaarde zinnen blijven staan, ook na herladen.
6. Geen zin om te kiezen? **Verras me** kiest een situatie, een toon én een voorbeeldverzoek, en geeft meteen drie zinnen.

De taalkeuze (NL/EN) staat rechtsboven. Nederlands is de standaard; de keuze wordt onthouden.

## Kenmerken

- Alleen HTML, CSS en JavaScript. Geen backend, geen build-stap, geen externe bibliotheken of lettertypen.
- Werkt direct door `index.html` te openen, ook offline.
- 72 zinnen per taal (4 situaties × 3 tonen × 6), elk in een algemene vorm en een vorm met jouw tekst erin.
- Toegankelijk: echte formulierelementen, labels, zichtbare focus, voldoende contrast, meldingen voor schermlezers, ondersteuning voor verminderde beweging en hoog contrast.
- Mobile-first en bruikbaar vanaf 320 px breed.
- Privacy: bewaarde zinnen en de taalkeuze staan alleen in de `localStorage` van je browser. Er wordt niets verstuurd.

## Zelf draaien

Dubbelklik op `index.html`, of start een lokale server:

```bash
cd Grens
python3 -m http.server 8000
```

Open daarna `http://localhost:8000`.

## Bestanden

| Bestand | Inhoud |
| --- | --- |
| `index.html` | Structuur van de pagina |
| `styles.css` | Vormgeving (crème, donkergroen, terracotta, zachte groentinten) |
| `main.js` | Logica: situaties, tonen, genereren, kopiëren, bewaren, taalwissel |
| `phrases.js` | Zinnenbank en voorbeeldverzoeken in het Nederlands en Engels |
| `docs/` | Schermafbeeldingen voor deze README |

Zinnen toevoegen of aanpassen doe je in `phrases.js`. Elke zin heeft een `generic`-variant (voor een leeg veld) en een `topic`-variant met `{x}` op de plek waar de tekst van de gebruiker komt.

## Op de website zetten

Upload de bestanden uit deze map (niet de map zelf) naar de map `grens` van de webruimte, zodat `index.html` op `https://philip-wintrip.com/grens/index.html` staat. Meer is niet nodig.

## Goed om te weten

Deze tool is een hulpmiddel om woorden te vinden, geen therapie of medisch advies.

---

# Grens · No-Sayer Script Generator (English)

**Live:** [philip-wintrip.com/grens](https://philip-wintrip.com/grens) · Dutch and English

A calm, friendly web app that gives you short phrases to decline messages, requests or appointments, without long explanations and without guilt. For people dealing with burnout, overstimulation, or who simply need some rest.

*'No' can be a complete sentence.*

<img src="docs/screenshot-en.png" alt="The No-Sayer Script Generator on a phone: situation Social, tone Short, three phrases" width="390">

## What it does

1. Pick a **situation**: Work, Social, Family or Appointment.
2. Optionally type **what the request is about** (max. 140 characters). You can leave it empty.
3. Pick a **tone**: Warm, Short or Clear.
4. Press **Give me words**. You get three different phrases, with your text woven in naturally.
5. **Copy** a phrase to your clipboard, or **save** it with the heart. Saved phrases survive a reload.
6. Can't decide? **Surprise me** picks a situation, a tone and an example request, and gives you three phrases straight away.

The language switch (NL/EN) is in the top right. Dutch is the default; your choice is remembered.

## Features

- Plain HTML, CSS and JavaScript. No backend, no build step, no external libraries or fonts.
- Works by simply opening `index.html`, also offline.
- 72 phrases per language (4 situations × 3 tones × 6), each in a generic form and a form with your text inserted.
- Accessible: real form controls, labels, visible focus, sufficient contrast, screen-reader announcements, support for reduced motion and high contrast.
- Mobile-first and usable from 320 px wide.
- Privacy: saved phrases and the language choice live only in your browser's `localStorage`. Nothing is sent anywhere.

## Run it locally

Double-click `index.html`, or start a local server:

```bash
cd Grens
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

| File | Contents |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | Styling (cream, dark green, terracotta, soft greens) |
| `main.js` | Logic: situations, tones, generating, copying, saving, language switch |
| `phrases.js` | Phrase bank and example requests in Dutch and English |
| `docs/` | Screenshots for this README |

To add or change phrases, edit `phrases.js`. Each phrase has a `generic` variant (for an empty field) and a `topic` variant with `{x}` where the user's text goes.

## Putting it on the website

Upload the files in this folder (not the folder itself) into the `grens` folder on the web host, so that `index.html` ends up at `https://philip-wintrip.com/grens/index.html`. Nothing else is needed.

## Good to know

This is a tool for finding words, not therapy or medical advice.
