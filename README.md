# Playlist Harmonizer

Organise your playlists for perfect DJ sets. Paste a playlist URL from Spotify, Apple Music, or Tidal and get a DJ-friendly track order based on harmonic compatibility (Camelot system) and energy flow.

No login required — all audio analysis runs in your browser.

## Features

- **Playlist import** — paste a URL from Spotify, Apple Music, or Tidal, or enter tracks manually
- **Audio analysis** — detects key, BPM, and energy from 30-second previews using [Essentia.js](https://mtg.github.io/essentia.js/) (WASM, runs entirely in the browser)
- **Camelot sorting** — orders tracks for smooth harmonic transitions using the Camelot wheel system, with gradual energy progression
- **Full playback** — play tracks via YouTube directly in the app
- **Visualisations** — Camelot wheel key distribution and energy flow graph
- **Export** — copy to clipboard, download as text, share via permalink, or push to any service via [Soundiiz](https://soundiiz.com)
- **Light/dark mode** — toggle between themes, preference saved locally
- **Shareable permalinks** — compressed playlist data encoded in the URL, no backend needed

## How it works

1. Paste a playlist URL or track list
2. Tracks are matched against Deezer's catalogue for 30-second audio previews
3. Each preview is analysed in-browser using Essentia.js WASM for key, BPM, and energy
4. A nearest-neighbour algorithm sorts the tracks by Camelot harmonic compatibility, energy progression, and BPM proximity
5. Results are displayed with transition quality indicators between each track

## Getting started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

The dev server runs at `http://localhost:5173`.

## Tech stack

- [React 18](https://react.dev) + [Vite](https://vite.dev)
- [Essentia.js](https://mtg.github.io/essentia.js/) — WASM audio analysis (key, BPM, energy)
- [lz-string](https://pieroxy.net/blog/pages/lz-string/index.html) — URL-safe permalink compression
- [Deezer API](https://developers.deezer.com/api) — track search and preview URLs (via server proxy)
- [YouTube embed](https://developers.google.com/youtube/player_parameters) — full track playback

## Playlist URL support

| Service | URL import | How it works |
|---------|-----------|--------------|
| Spotify | Yes | Parses the embed page for track data and preview URLs |
| Apple Music | Yes | Parses JSON-LD (curated) or embedded JSON (user playlists) |
| Tidal | Detection only | Tidal doesn't expose track data publicly; paste your track list manually |

## Tests

85 unit tests covering the Camelot system, sorting algorithm, permalink encoding, caching, playlist URL detection, and audio analysis utilities.

```bash
npm test           # single run
npm run test:watch # watch mode
```

## Deployment

Pushes to `main` trigger a GitHub Actions workflow that runs tests and deploys to Netlify. Requires `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets in the repo.
