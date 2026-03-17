# 🎾 Tennis Match Manager

A lightweight Progressive Web App (PWA) for managing tennis doubles matches. Designed for tennis groups that rotate players across courts and want fair, balanced pairings.

**Live app:** [walkowl.github.io/tennis-match-manager](https://walkowl.github.io/tennis-match-manager/)

## Features

- **Smart match generation** — global hill-climbing optimizer creates balanced doubles pairings across all courts simultaneously
- **Skill-based matchmaking** — optional skill ratings (1-5) ensure balanced team totals, varied teammates, and similar-skill partners
- **Fairness tracking** — tracks match counts and teammate history to maximize variety and avoid repetitive pairings
- **Mid-session flexibility** — players can join or leave during a session; new players receive the average match count so they blend in naturally
- **Player status cycling** — tap a player to cycle through: Active → Sit out 1 round → Sit out 2 rounds → Inactive → Active
- **Slot machine reveal** — match results are revealed with a vertical-scrolling slot machine animation with sound effects
- **Font scaling** — adjustable font size (50%-200%) via Options, persisted across sessions
- **Auto-reset** — tracking data is automatically cleared after 6 hours of inactivity
- **Offline support** — works without internet as a PWA (installable on mobile/tablet)
- **Persistent state** — all data saved to localStorage, survives page refreshes
- **Check for Updates** — in-app update button for iPad PWA users who can't hard-refresh

## Quick Start

### With a custom player list

Create a CSV file with the required header:

```csv
name,rating
Lukasz Walkow,5
Andrus Tonismae,4
Bob Bear
```

Then load it via URL parameter:

```
https://walkowl.github.io/tennis-match-manager/?players_url=https://example.com/players.csv
```

Or load it from **⚙ Options → Advanced → Load Players from URL**.

### Default usage

Just open the app and add players manually via Edit Mode in the Select Players modal.

## How It Works

1. **Select players** for the session from your player list
2. **Tap "Create matches"** to generate fair court assignments with a slot machine animation
3. The algorithm optimizes across all courts simultaneously for:
   - **Balanced teams** — minimizes skill gap between teams (quadratic penalty)
   - **Teammate variety** — avoids repeating the same doubles partners
   - **Similar-skill teammates** — pairs players of similar ability when possible
4. Players with fewer matches get priority for play time
5. Players who can't fit on a court are listed as "Resting"

### Player Statuses

| Status | Meaning |
|--------|---------|
| **Active** | Will be included in match generation |
| **Sit out 1** | Excluded from the next round, then returns to active |
| **Sit out 2** | Excluded from the next two rounds |
| **Inactive** | Excluded from matches until manually reactivated |

## Player File Format

Player files must be CSV format with a required header line:

```csv
name,rating
Lukasz Walkow,5
Andrus Tonismae,4
Bob Bear
```

| Column | Required | Description |
|--------|----------|-------------|
| `name` | Yes | Player's full name |
| `rating` | No | Skill rating 1-5 (1=weakest, 5=strongest, default: 3) |

The header line (`name,rating` or just `name`) is **mandatory**. Files without the correct header will be rejected.

Skill ratings can also be edited per-player in the app via Edit Mode.

## URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `players_url` | URL to a CSV player list (see format above) | `?players_url=https://example.com/players.csv` |
| `overwrite_players` | Force reload players from URL | `?players_url=...&overwrite_players=true` |

## Hidden Features

| Action | What it does |
|--------|-------------|
| **Double-tap "Players" label** | Shows app version date (fades after 3s) |
| **Double-tap match area** | Shows skill ratings next to player names (fades after 10s) |
| **Tap "Players" label** | Bouncing tennis balls Easter egg 🎾 |

## Tech Stack

- Vanilla JavaScript (no framework)
- [Bootstrap 5](https://getbootstrap.com/) for UI components
- [Matter.js](https://brm.io/matter-js/) for the bouncing balls Easter egg 🎾
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for slot machine sound effects
- [Workbox](https://developer.chrome.com/docs/workbox/) for service worker / offline support
- [Jest](https://jestjs.io/) for unit testing (107 tests)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Tests run automatically on every git commit via pre-commit hook
```

The pre-commit hook also:
- Updates the version date
- Regenerates the service worker for cache busting
- Cleans up old Workbox runtime files

## Project Structure

```
├── index.html          # Main HTML (modals, layout)
├── index.js            # UI logic, DOM interactions, animations
├── logic.js            # Pure business logic (matchmaking, scoring, parsing)
├── logic.test.js       # Unit tests (Jest, 107 tests)
├── index.css           # Styles (reels, modals, responsive)
├── sw.js               # Service worker (generated by Workbox)
├── manifest.json       # PWA manifest
├── workbox-config.js   # Workbox configuration
├── package.json        # npm config (Jest)
├── assets/             # Images (tennis ball, background)
├── css/                # Bootstrap CSS
└── js/                 # Bootstrap JS, Matter.js
```
