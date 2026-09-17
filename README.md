# 🍽️ Wochenplan – Meal Planning PWA

Intelligente Wochenplan- und Rezept-Verwaltung für Familien. Plane Mahlzeiten auf dem PC, koche mit optimierter Handy-UI in der Küche, synchronisiere zwischen Geräten via GitHub.

## Features (geplant)

### Phase 1 (MVP) ✅ In Arbeit
- [x] Rezept-Verwaltung: Hinzufügen, Bearbeiten, Löschen
- [x] Foto-Upload von Kochbüchern
- [x] Rezept-Import von URLs
- [x] Lokale Speicherung (IndexedDB)
- [ ] Basis-UI für Rezepte

### Phase 2
- [ ] 7-Tage Wochenplan-Generator
- [ ] Intelligente Vorschläge (keine Duplikate, Abwechslung)
- [ ] Rezept-Varianten für Kinder

### Phase 3
- [ ] Feedback-System (Bewertungen, Timing, Anpassungen)
- [ ] Kochmodus (Handy-optimiert, großer Text, Timer)
- [ ] Schritt-für-Schritt Anleitung in der Küche

### Phase 4
- [ ] GitHub-Sync (PC ↔ Handy)
- [ ] Offline-Modus
- [ ] Vorratsapp-Integration (was ist da, was muss weg)

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6 Modules)
- **Storage:** IndexedDB (Rezepte, Fotos) + localStorage (Wochenpläne)
- **Sync:** GitHub API (recipes.json, weekplans/)
- **PWA:** Service Worker, manifest.json
- **Responsive:** Mobile-first CSS, adaptive für PC/Handy

## Installation & Development

### Lokal starten
```bash
git clone https://github.com/dein-username/wochenplan.git
cd wochenplan
# Öffne index.html im Browser (oder starte einen lokalen Server)
python3 -m http.server 8000
# Öffne dann http://localhost:8000
```

### Auf GitHub Pages deployen
```bash
git push origin main
# GitHub Pages: Settings → Pages → Branch: main → Speichern
# Live unter: https://dein-username.github.io/wochenplan/
```

## Datenstruktur

### Rezept (Beispiel)
```json
{
  "id": "uuid",
  "title": "Spaghetti Bolognese",
  "cookTime": 30,
  "difficulty": "easy",
  "ingredients": [
    { "name": "Hackfleisch", "amount": 500, "unit": "g" }
  ],
  "instructions": "1. Fleisch anbraten...",
  "tags": ["schnell", "fleisch"],
  "variants": {
    "children": { "instructions": "..." }
  },
  "photos": ["blob-id-1"],
  "feedback": {
    "childrenRating": 5,
    "notes": "Nächstes Mal weniger Gewürz"
  }
}
```

### Wochenplan (week-YYYY-WXX.json)
```json
{
  "id": "week-2026-W38",
  "weekStart": "2026-09-15",
  "days": [
    {
      "day": "Monday",
      "recipeId": "uuid",
      "status": "planned"
    }
  ]
}
```

## GitHub Sync

1. **Persönlicher Token erstellen:** [GitHub Settings → Developer settings](https://github.com/settings/tokens)
   - Scope: `repo` (vollständiger Zugriff auf private Repos)
2. **Token in der App eingeben:** Settings → GitHub Sync
3. **Auto-Sync** oder manuell via "Sync Now" Button

## Roadmap

```
September 2026:  Phase 1 - Rezept-Verwaltung
Oktober 2026:    Phase 2 - Wochenplan-Generator
November 2026:   Phase 3 - Feedback + Kochmodus
Dezember 2026:   Phase 4 - GitHub Sync + Integration
```

## Architektur

```
src/
├── app.js                 # Einstiegspunkt, UI-Router
├── core/
│   ├── storage.js        # IndexedDB + localStorage Manager
│   ├── recipe.js         # Rezept CRUD-Operationen
│   ├── weekplan.js       # Wochenplan CRUD
│   └── generator.js      # Intelligente Vorschläge
├── ui/
│   ├── recipe-list.js    # Rezept-Übersicht
│   ├── recipe-form.js    # Rezept hinzufügen/bearbeiten
│   ├── weekplan-view.js  # 7-Tage-Ansicht (PC)
│   ├── cook-mode.js      # Kochmodus (Handy)
│   └── components/
│       └── ...
└── utils/
    ├── sync.js           # GitHub API Integration
    ├── import.js         # URL → Rezept Parser
    └── photo.js          # Foto-Upload & -Speicherung
```

## Browser Support

- Chrome/Edge 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- PWA-Support: iOS 16.1+, Android 5+

## License

MIT

---

**Entwickelt für die Familie** 👨‍👩‍👧‍👦 | Berlin, 2026
