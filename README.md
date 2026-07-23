# Gesundheitsakte 3.3.7 – Repariertes Dokumentenarchiv

## Behobener Fehler

Die Version 3.3.6 griff auf eine nicht vorhandene Eigenschaft `GAChoices.lists.rubrics` zu.
Der richtige Katalog heißt `GAChoices.catalogs.rubricOptions`.

Dadurch erschien:

`Cannot read properties of undefined (reading 'rubrics')`

## Änderungen

- Startfehler im Dokumentenarchiv behoben
- Rubrikliste für Sammelbearbeitung wieder verfügbar
- Rubrikliste beim Umbenennen und Verschieben wieder verfügbar
- zusätzliche Schutzprüfung eingebaut, damit ein fehlender Katalog die App nicht vollständig stoppt
- alle vorhandenen Dokumente und Laborwerte bleiben unverändert erhalten

## Installation

Alle Dateien auf GitHub ersetzen. Danach `update.html` öffnen und den Cache aktualisieren.

Erwartete Anzeige:

**Version 3.3.7 · Repariertes Dokumentenarchiv**
