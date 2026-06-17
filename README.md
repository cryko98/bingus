# OG Bingus — $BINGUS 🐱

The official meme site for **OG Bingus** ($BINGUS), a Solana memecoin built around the
original wrinkly sphynx meme. *hi bingus.*

A single-page, fully responsive site with hand-drawn **SVG art** (no emoji clip-art),
the documented meme lore, tokenomics, a how-to-buy guide, and a **Gemini-powered Meme Lab**.

## Features

- **Custom SVG Bingus** mascot drawn from scratch — used across the hero, sections and the meme maker.
- **Meme Lab** with two modes:
  - **AI Image Maker** — generates fresh Bingus memes with Google `gemini-2.5-flash-image` (nano banana).
  - **Classic Caption Maker** — renders top/bottom text over the SVG Bingus on a `<canvas>`, with an
    optional "let Gemini write it" button (`gemini-2.5-flash`). Works even without an API key.
- No build step. Plain HTML / CSS / JS — drop it on any static host (GitHub Pages, Netlify, Vercel…).

## Gemini API key

The Meme Lab calls the Gemini API **directly from the browser**. Paste a key into the field in the
Meme Lab section — it is stored only in your browser's `localStorage` and never sent anywhere except
to Google's API. Get a free key at <https://aistudio.google.com/app/apikey>.

> ⚠️ Because this is a static site, the key lives client-side. For a production deployment with a
> shared key, proxy the Gemini calls through a small serverless function instead of shipping the key.

## Run locally

Just open `index.html`, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup + inline reusable SVG defs |
| `styles.css` | All styling (bingus-pink × Solana palette) |
| `script.js`  | Interactions, Gemini calls, canvas meme maker |

## Disclaimer

$BINGUS is a meme coin with no intrinsic value or expectation of financial return. Not financial
advice. Bingus the cat belongs to his original owner. Meme lore sourced from
[Know Your Meme](https://knowyourmeme.com/memes/bingus).
