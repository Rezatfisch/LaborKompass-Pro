# Gesundheitsakte 3.3.2 – Stabilitätsupdate

## Behoben

- Der Startfehler `ensureChoiceLists is not defined` ist beseitigt.
- Die App startet auch dann weiter, wenn eine optionale Hilfsfunktion fehlschlägt.
- Dokumente und vorhandene lokale Daten werden unverändert weiterverwendet.
- Flexible Auswahllisten werden beim Start sicher erzeugt.
- Dokumentart, Fachgebiet, Hauptrubrik und Körperregion bieten feste Vorschläge und erlauben weiterhin freie Eingaben.
- Eigene und bereits verwendete Begriffe fließen in spätere Vorschläge ein.
- Nach dem Speichern werden Suche und Filter zurückgesetzt und das neue Dokument sichtbar hervorgehoben.
- Ein lokales technisches Fehlerprotokoll hilft bei künftigen Problemen, ohne Gesundheitsdaten zu versenden.

## Installation

Alle Dateien aus der ZIP auf GitHub hochladen und vorhandene Dateien ersetzen. Danach `update.html` öffnen und den Cache aktualisieren. Angezeigt werden muss:

**Version 3.3.2 · Stabilitätsupdate**
