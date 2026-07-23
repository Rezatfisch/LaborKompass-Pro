# Gesundheitsakte 3.0.0

Komplett neu aufgebauter, modularer Kern.

## Dateien
- index.html – Oberfläche
- styles.css – Gestaltung
- storage.js – Datenspeicher und Migration
- extractors.js – Dokument-, Labor- und Fachwerterkennung
- importer.js – PDF-, Bild-, OCR- und Textimport mit Schrittanzeige
- ui.js – sichere Darstellung und Analyseformen
- app.js – App-Steuerung
- service-worker.js – PWA-Cache
- update.html – Cachebereinigung vor dem ersten Start

## Wichtig
Die bisherigen lokalen Daten unter den Schlüsseln `lk_values`, `lk_documents`, `lk_diag`, `lk_meds`, `lk_sym`, `lk_vitals`, `lk_vaccinations`, `lk_allergies` und `lk_operations` werden weiterverwendet.

Nach dem Hochladen aller Dateien einmal öffnen:
https://rezatfisch.github.io/LaborKompass-Pro/update.html
