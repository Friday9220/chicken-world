# Chicken World

Live: https://chickenworld.dk (domæne hos Simply, peger på GitHub Pages via filen `CNAME`).

Hjemmeside for Chicken World, Banegårdspladsen 13, 8850 Bjerringbro.

Siden er ren HTML, CSS og JavaScript uden byggetrin. Åbn `index.html` i en browser, eller læg mappen på GitHub Pages.

- `index.html` – forsiden
- `menu.html`, `menu.css`, `menu.js` – menu med kurv og bestilling (afhentning eller levering)
- `menu-data.js` – alle retter og priser (ret priser her)
- `site-config.js` – åbningstider, levering, telefon og forbindelse til ordre-databasen (Supabase)
- `udlejning.html` – udlejning af slush ice- og candyflossmaskine med bookingformular
- `handelsbetingelser.html` – handelsbetingelser
- `personale.html` – ordreskærm til butikken; kræver adgangskode (sættes med `supabase/opdatering-adgangskode.sql`). Kan printe bon på en 80 mm bonprinter
- `styles.css` – design (farver øverst under `:root`)
- `script.js` – åbent/lukket-status og scroll-animationer
- `supabase/opsaetning.sql` – opsætning af databasen (nøglen indsættes før kørsel)
- `supabase/opdatering-accepter-afvis.sql` – kør én gang efter opsætningen: køkkenet kan acceptere (15/30/45/60 min) eller afvise, og kunden ser status
- `supabase/opdatering-forudbestilling.sql` – kør én gang: ordreskærmen viser aktive ordrer bestilt op til 14 dage frem
- `tjek.html` – åbn i browseren for at tjekke hele siden: links, billeder, menu, tider og ordresystemet (opretter ingen ordrer)
- `assets/img/` – billeder fra butikken og logo

## Sådan kommer ordrerne ind

Kunden bestiller på `menu.html`. Ordren gemmes i Supabase og dukker op på `personale.html` med lyd.
Levering vises med rødt mærke og adressen øverst; udlejningsforespørgsler vises med blåt mærke.
Kunden betaler ved afhentning eller levering, og personalet slår salget ind i Shopbox som normalt.

## Automatisk print af bon

Tryk "Auto-print til" på ordreskærmen. For at undgå printdialogen hver gang kan Chrome startes med
`--kiosk-printing`, så bonnen sendes direkte til standardprinteren.
