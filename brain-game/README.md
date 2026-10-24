# BrainForge — Think Better

BrainForge is a mobile-first, static brain-training web app with 10 playable mini-games. It is isolated in this brain-game directory; the existing KITA and BAZY project files are not changed by this app.

## Games included
1. **Sequence Lab** — numerical sequences and rule discovery.
2. **Memory Matrix** — memorise a grid, then reproduce the lit cells.
3. **Deduction Room** — reasoning puzzles based on clues and careful logic.
4. **Mental Sprint** — timed mental arithmetic with a 30-second round.
5. **Pattern Vision** — missing-tile visual pattern puzzles.
6. **Word Twist** — letter unscrambling.
7. **Lights Out** — toggle a cell and its neighbours to switch all lights off.
8. **Code Breaker** — Mastermind-style code deduction with precise feedback.
9. **Mini Sudoku** — 4×4 Sudoku with row, column and box rules.
10. **River Crossing** — the farmer, wolf, goat and cabbage planning puzzle.

## Run it
Open index.html in a browser for basic play. For install prompts and full offline caching, serve the folder over HTTPS or localhost (service workers do not run reliably from a file URL).

No build step, login, external library, account or network API is required. Game progress and best scores are stored locally in the browser on the current device; they do not sync across devices.

## Mobile installation
Open the hosted app in Chrome on Android and choose **Install app** or **Add to Home screen**. The app shell and game assets are cached by the service worker after the first successful load.

## Project structure
- index.html — app shell and accessible page structure
- styles.css — responsive mobile-first UI
- app.js — game rules, interactions and local score tracking
- manifest.json — installable web app metadata
- sw.js — offline asset cache
- icon.svg — app icon

## Testing checklist
- Open each card and verify restart / return-to-games controls.
- Check each game’s win and loss flow.
- Verify scores persist after refresh on the same browser.
- Test on a narrow phone screen and with browser offline after the first load.
