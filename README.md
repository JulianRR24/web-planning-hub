# Web Planning Hub

A responsive, modular personal planning web app designed for users with non-traditional schedules (rotating shifts, complex family schedules). Phase 1 delivers a clean static UI with mobile-first navigation and a dashboard of clickable widgets.

## Overview
- Status: Phase 1 (Static HTML + CSS) complete and aligned with the design vision.
- Navigation: Bottom fixed nav with 4 primary screens.
- Pages:
  - Home (index.html): Top 2x2 compact widgets + daily agenda below.
  - Routines (rutinas.html): Agenda view + routine selector + link to manage routines.
  - Manage Routines (gestionar-rutinas.html): Static CRUD list placeholders.
  - Widgets (widgets.html): Widget dashboard grid; all items clickable.
  - Market List (mercado.html): Simple checklist with CTA.
  - Settings (config.html): Mock settings for future use.

## Key Features (Phase 1)
- Mobile-first UI using Tailwind CDN and a lightweight custom design system.
- Bottom navigation with consistent 4 tabs: Home, Routines, Widgets, Settings.
- Clickable widgets via anchor tags, linking to internal pages or external resources.
- Daily agenda timeline with sample events and a static current-time indicator.

## Tech Stack
- Markup/Styles: HTML5, Tailwind CSS (CDN), custom CSS variables (styles.css).
- JavaScript: Placeholder files for later phases (no active logic yet).
- No build tooling required; static files are directly viewable in a browser.

## Project Structure
```
web-planning-hub/
├─ index.html                 # Home: 2x2 widgets + daily agenda
├─ rutinas.html               # Routines: agenda + selector + link to CRUD
├─ gestionar-rutinas.html     # Manage routines: static CRUD list
├─ widgets.html               # Dashboard: clickable widget grid
├─ mercado.html               # Market list: basic checklist
├─ config.html                # Settings: future options
├─ css/
│  └─ styles.css             # CSS variables and reusable classes
├─ js/
│  ├─ main.js
│  ├─ rutinas.js
│  ├─ widgets.js
│  └─ utils.js
└─ assets/                    # (reserved)
```

## Design System
- CSS variables in `:root` for colors, radii, shadows, and spacing.
- Reusable classes:
  - `.container` layout utility
  - `.card` elevated surface with border and radius
  - `.button`, `.button-primary`, `.button-secondary`
- Icons via inline SVGs.

## Accessibility
- Mobile-first layout and large touch targets.
- ARIA labels on interactive icons and navigation items.
- Next: focus states, `aria-current` in nav, keyboard navigation, and color contrast validation.

## How to Run
- Open `index.html` in your browser.
- Navigate using the bottom menu.
- External links open in a new tab when appropriate (e.g., Pico y Placa, Weather).

## Roadmap
- Phase 1 (now): Static UI, responsive pages, clickable widgets. ✅
- Phase 2: Interactivity (JavaScript)
  - Hash-based SPA routing (no full-page reloads).
  - State layer with `localStorage` for:
    - Routines list and active routine.
    - Favorite widgets (render top 2x2 on Home).
    - Market list CRUD.
    - Basic prefs (theme, language, city).
  - Dynamic current-time indicator in the agenda.
  - Widgets backed by APIs (e.g., weather) with graceful fallbacks.
- Phase 3: Persistence & Users (Backend)
  - Migrate state from `localStorage` to Firebase/Supabase.
  - Authentication (email/password, OAuth).
  - Sync across devices, security rules, and quota management.
- Phase 4: Intelligence & Automation
  - Smart suggestions for schedules.
  - Intelligent reminders and notifications.
  - Pattern-based agenda prefill.

## Planned Data Model (Phase 2)
- `userPreferences`: `{ theme, language, city, timeFormat }`
- `routines`: `[{ id, name, icon, schedule: [{ id, title, start, end, color }], isActive }]`
- `activeRoutineId`: `string`
- `widgetsCatalog`: `[{ id, type, name, config }]`
- `favoriteWidgets`: `[{ id, order, configOverrides }]` (max 4 for Home)
- `marketList`: `[{ id, text, done }]`

## Contribution
- Keep code clean, modular, and self-explanatory.
- Use explicit imports and avoid wildcard usage.
- Maintain consistent formatting and naming.
- Open issues for discussion before large changes.

## License
MIT License.
