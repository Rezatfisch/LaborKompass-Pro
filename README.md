# Gesundheitsakte 3.3.8 – Debug & Stabilität

## Behoben

- Kompatibilität für alte Aufrufe von `GAChoices.lists.rubrics` ergänzt.
- Der richtige neue Katalog `GAChoices.catalogs.rubricOptions` bleibt erhalten.
- Selbst wenn Android noch eine ältere `app.js` ausliefert, steht die alte Rubrik-Schnittstelle weiterhin zur Verfügung.
- Alle JavaScript- und CSS-Dateien tragen nun eine Versionskennung, damit keine gemischten Versionen geladen werden.
- Der Service Worker verwendet für Programmdateien jetzt „Netzwerk zuerst“ und entfernt sämtliche alten Programm-Caches.
- `update.html` entfernt Service Worker und Caches vollständig, ohne Gesundheitsdaten oder Originalbelege zu löschen.
- Startbereiche werden getrennt abgesichert: Ein Fehler in einem Teil soll nicht mehr die komplette App stoppen.
- Der bereits behobene alte Rubrikfehler wird nach erfolgreichem Start aus dem technischen Fehlerprotokoll entfernt.
- Interne Diagnoseinformationen zu Version, Service Worker und geladenen Rubriken sind verfügbar.

## Installation

Alle Dateien auf GitHub ersetzen. Danach unbedingt `update.html` öffnen und die automatische Weiterleitung abwarten.

Erwartete Anzeige:

**Version 3.3.8 · Debug & Stabilität**
