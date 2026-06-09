# FootyTrump ⚽

FIFA World Cup 2026–themed football **trump-card game** (+ quiz, coming later).
Inspired by the author's Cricket Trump Card game.

Battle a CPU on footballer stats — **Matches, Goals, Assists, Tackles, Saves, Clean Sheets** —
with a curated roster of 59 post-1990 internationals across rarity tiers. Goalkeepers are rarer,
so playing one for Saves / Clean Sheets is a power move.

## Run locally
```bash
npm install                 # root (engine tests + tooling)
npm install --prefix client # client deps
npm run dev                 # starts the Vite client (http://localhost:5173)
npm test                    # runs the engine + data test suite
```

## Structure
- `shared/engine` — pure, tested rules engine (single source of truth: deal, select, resolve, bot)
- `shared/data` — curated player roster + validation
- `client` — React + Vite + Tailwind UI (solo vs CPU) in a green-pitch / Royal-Navy-Gold theme

## Status
- ✅ **Plan A: engine + solo vs CPU** (this build) — playable
- ⏳ Plan B: online rooms (Railway + Socket.io) — same engine, multiplayer
- ⏳ Plan C: quiz (Guess the Footballer + Multiple Choice)

Design + plans live in [`docs/superpowers/`](docs/superpowers/).
