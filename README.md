# OG Bingus — $BINGUS 🐱

The official meme site for **OG Bingus** ($BINGUS), a Solana memecoin built around the
original wrinkly sphynx meme. *hi bingus.*

A single-page, fully responsive site with hand-drawn **SVG art** (no emoji clip-art),
the documented meme lore, tokenomics, a how-to-buy guide, and a **Gemini-powered Meme Lab**.

## Features

- **Custom SVG Bingus** mascot drawn from scratch — used across the hero, sections and the meme maker.
- **Meme Lab** — an **AI Image Maker** that generates fresh Bingus memes with Google
  `gemini-2.5-flash-image` (nano banana), using `binguslogo.png` as a reference image so every
  result actually looks like the OG cat.
- The Gemini call runs in a **serverless function** (`api/generate.js`), so the API key stays on the
  server and never reaches the browser.

## Deploy to Vercel

This is the intended host. The static files are served from the project root and `api/generate.js`
becomes a serverless function automatically.

1. Import the repo into [Vercel](https://vercel.com/new) (Framework Preset: **Other**, no build).
2. Add an environment variable:

   | Name | Value |
   |------|-------|
   | `GEMINI_API_KEY` | your Google AI Studio key (<https://aistudio.google.com/app/apikey>) |

3. Deploy. The Meme Lab calls `POST /api/generate` which uses the key server-side.

> The browser never sees the key — it only sends the prompt and the reference image to `/api/generate`.

## Run locally

The static page works with any file server, but the **Meme Lab needs the serverless function**, so
use the Vercel CLI for full functionality:

```bash
npm i -g vercel
vercel dev            # serves the site + /api/generate, reads GEMINI_API_KEY from a local .env
```

Static-only preview (Meme Lab will report that `/api/generate` is unavailable):

```bash
python -m http.server 8000
```

## Files

| File | Purpose |
|------|---------|
| `index.html`     | Markup + inline reusable SVG icon defs |
| `styles.css`     | All styling (bingus-pink × Solana palette) |
| `script.js`      | Interactions + Meme Lab (calls `/api/generate`) |
| `api/generate.js`| Serverless Gemini proxy (reads `GEMINI_API_KEY`) |
| `binguslogo.png` | The OG Bingus — logo, favicon, mascot & meme reference |

## Disclaimer

$BINGUS is a meme coin with no intrinsic value or expectation of financial return. Not financial
advice. Bingus the cat belongs to his original owner. Meme lore sourced from
[Know Your Meme](https://knowyourmeme.com/memes/bingus).
