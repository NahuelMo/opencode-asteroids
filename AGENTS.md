# AGENTS.md

Asteroids clone — plain HTML5 Canvas + vanilla JS. **No package.json, no dependencies, no bundler, no tests, no linter, no CI.** Don't look for npm scripts; there aren't any.

## Run & verify

- Open `index.html` directly in a browser, or `npx serve .` → http://localhost:3000.
- Verification is manual: play the game in the browser and watch the console for errors.

## Conventions & gotchas

- All game logic lives in the single file `game.js` (plain script, `'use strict'`, no ES modules). Keep it single-file; don't introduce a bundler or split it up.
- Canvas size is duplicated: `<canvas width="800" height="600">` in `index.html` **and** the `W`/`H` constants in `game.js`. All wrap/collision/HUD math uses `W`/`H`, so keep both in sync.
- UI strings and README are in Spanish (`lang="es"`); write new user-facing text in Spanish.
- `RADII` / `SPEEDS` / `POINTS` are indexed by asteroid size 1 (small) … 3 (large); index 0 is an unused placeholder. Sizes split 3→2→1 via `Asteroid.split()`.
- Input is keyed by `e.code`: held keys read from `keys[]`, single presses via `pressed(code)` — which consumes the flag, so call it at most once per frame per key. Add new scrolling keys to the `keydown` `preventDefault` list.
- Velocities are px/s, `dt` is in seconds (clamped to 0.05), and positions wrap toroidally via `wrap()`.
- The README's feature list mentions "power-ups" and "estrella fugaz" that are **not implemented** in the code. Treat them as unstarted roadmap, not existing behavior.
