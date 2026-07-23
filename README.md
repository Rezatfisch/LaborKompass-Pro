# Gesundheitsakte 3.2.2 – präzise medizinische Zuordnung

Diese Version verbessert gezielt die Einordnung importierter Dokumente. Der funktionierende PDF-/Scan-PDF-Import aus Version 3.2.1 bleibt erhalten.

## Neu: getrennte medizinische Zuordnung

Jedes Dokument erhält getrennte Felder für:

- Dokumentart
- Hauptrubrik
- erstellendes Fachgebiet
- medizinisches Themengebiet
- Körperregion
- Körperseite
- alternative Fachgebietsvorschläge
- Erkennungsbegriffe und Erkennungssicherheit

Beispiel für ein Schulter-MRT:

- Dokumentart: MRT-Befund
- Hauptrubrik: Bildgebung
- erstellendes Fachgebiet: Radiologie
- medizinisches Themengebiet: Orthopädie / Unfallchirurgie
- Körperregion: Bewegungsapparat › Schulter
- Körperseite: rechts

## Bessere Hauptrubriken

- Befunde und Arztbriefe
- Bildgebung
- Labor
- Diagnosen
- Behandlungen und Therapien
- Operationen
- Medikamente
- Augen und Optik
- Zahnmedizin
- Psychische Gesundheit
- Rechnungen und Kosten
- Impfungen
- Vorsorge und Prävention
- Sonstiges

## Werte werden nach Art getrennt

- Laborwerte
- Vitalwerte
- Augenwerte
- Hörwerte
- Bewegungswerte
- Bildgebungsmaße
- Zahncodes
- Medikamentendosen
- Kosten
- allgemeine Messwerte

Zahlen aus MRT- oder Arztberichten werden dadurch nicht pauschal als Laborwerte behandelt.

## Lokales Lernen

Wenn die automatische Einordnung korrigiert wird, kann die App diese Korrektur lokal auf dem Gerät speichern. Ähnliche Dokumente werden danach bevorzugt entsprechend eingeordnet. Die Dokumentdaten und Lernregeln verlassen das Gerät nicht.

## Installation

Alle Dateien aus der ZIP in das Hauptverzeichnis des GitHub-Repositories hochladen und vorhandene Dateien ersetzen. Die neue Datei `medknowledge.js` muss ebenfalls hochgeladen werden.

Danach öffnen:

https://rezatfisch.github.io/LaborKompass-Pro/update.html
