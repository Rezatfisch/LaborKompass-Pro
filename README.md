# Gesundheitsakte 3.2.1 – intelligenter Dokumentimport

Diese Version konzentriert sich bewusst auf den ersten stabilen Entwicklungsschritt: den Import medizinischer Dokumente jeglicher Art.

## Importierte Dateitypen
- PDF mit eingebettetem Text
- Fotos und Scans mit OCR
- mehrere Fotos/Dateien als gemeinsames Dokument
- TXT, CSV und eingefügter Text
- Dateien aus Android-Dateien, OneDrive oder Google Drive über den System-Dateidialog

## Automatisch erkannte Grunddaten
- Dokumentname und Dokumentdatum
- Dokumentart und Rubrik
- Fachgebiet
- Körperregionen
- Aussteller/Praxis und behandelnde Person
- Adressen
- Diagnosen und ICD-Begriffe
- Medikamente
- Empfehlungen und Kontrollen
- Laborwerte mit erkannten Referenzgrenzen
- sonstige Messwerte
- Kostenangaben
- Termine
- wichtige Textaussagen

## Kontrollierte Vorschau
Jeder Import erscheint als kompakte, aufklappbare Karte. Vor dem Speichern können Name, Datum, Dokumentart, Fachgebiet, Rubrik, Aussteller, Behandler, Körperregionen, Diagnosen, Medikamente und Empfehlungen korrigiert werden.

## Dubletten
Ähnliche beziehungsweise identische Dokumente können ersetzt, als Kopie gespeichert oder verworfen werden.

## Bestehende Funktionen
Die Laborverläufe, Referenzbereiche, Ideal-/Orientierungsbereiche, Vergleiche, Fachwerte, Chronik, Analysen und Sicherungen aus Version 3.1 bleiben enthalten.

## Aktualisierung
Alle Dateien des Pakets in das Hauptverzeichnis des GitHub-Repositories laden und vorhandene Dateien ersetzen. Danach einmal öffnen:

https://rezatfisch.github.io/LaborKompass-Pro/update.html


## Korrektur in 3.2.1
- Scan-PDFs ohne eingebetteten Text werden automatisch erkannt.
- Jede PDF-Seite wird intern als hochauflösendes Bild gerendert.
- Anschließend läuft OCR automatisch auf jeder Seite.
- Der Benutzer muss PDF-Seiten nicht mehr vorher in Fotos umwandeln.
- Der Fortschritt wird seitenweise und prozentual angezeigt.
- Direkt auslesbare PDFs verwenden weiterhin den schnelleren Textmodus.
