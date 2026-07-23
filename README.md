# Gesundheitsakte 3.3.0 – Originalbeleg und Prüfarbeitsplatz

## Neu in Version 3.3.0

- Original-PDFs und Fotos werden vollständig lokal gespeichert.
- Mehrere Fotos eines Dokuments bleiben gemeinsam erhalten.
- Originalbeleg und Importergebnis können bereits vor dem endgültigen Speichern verglichen werden.
- Neuer Prüfarbeitsplatz mit vier Ansichten:
  1. Original
  2. Erkannte Daten
  3. OCR-Rohtext und bereinigter Text
  4. strukturierte Analyse
- PDF-Anzeige, Bildanzeige, Seiten-/Dateiauswahl und Zoom.
- Original kann nachträglich ergänzt oder ersetzt werden, ohne erkannte Daten zu löschen.
- Erkannte Daten können direkt im Prüfarbeitsplatz korrigiert werden.
- Prüfstatus: ungeprüft, teilweise geprüft, geprüft oder OCR unsicher.
- Technische Qualitätsbewertung für OCR, Vollständigkeit und Gesamtqualität.
- Korrekturhistorie mit Zeitpunkt und geänderten Feldern.
- Bereinigter OCR-Text kann bearbeitet und danach neu ausgewertet werden.
- Strukturierte Analyse in klar getrennten Karten statt ungeordnetem Fließtext.

## Wichtiger Hinweis zur Sicherung

Die JSON-Sicherung enthält die strukturierten Gesundheitsdaten. Originaldateien werden aus Datenschutz- und Größen-Gründen getrennt im lokalen Browser-Speicher (IndexedDB) abgelegt. Beim Löschen der Browserdaten können diese Originale verloren gehen.

## Installation auf GitHub Pages

Alle Dateien aus der ZIP in das Hauptverzeichnis des Repositorys hochladen und vorhandene Dateien ersetzen. Neu hinzugekommen ist `reviewer.js`.

Danach `update.html` öffnen und den Programmcache aktualisieren.
