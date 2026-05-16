# Preakness Countdown

A small static site that counts down to post time at the Preakness Stakes, lists the field with running odds and jockeys, links to tickets/wagering, drops the race onto your Google Calendar, and shows the race-day forecast for Pimlico.

## Pages

- `index.html` — Countdown, odds table (PP / Horse / Jockey / Odds), tickets and Google Calendar buttons, weather widget.
- `horses.html` — Full breakdown of every horse: jockey, trainer, owner, silks, and notes. Each row in the odds table deep-links to its card here.

## Run it

It's plain HTML/CSS/JS — no build step. Either open `index.html` directly, or serve the folder:

```
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Updating the field and odds

Edit `data.js`. Post time, venue, ticket links, and the horses array all live there. Once entries are drawn (typically the Monday of race week), update each horse's `pp`, `name`, `jockey`, `trainer`, `owner`, and `odds`. The odds table and the field-detail cards both regenerate from this file.

## Weather

The race-day forecast comes from [Open-Meteo](https://open-meteo.com/) — no API key needed. Open-Meteo's forecast horizon is ~16 days; outside that window the widget shows a placeholder.

## Deploy to Vercel

The repo is Vercel-ready — no build step, no framework preset needed. `vercel.json` enables clean URLs (so `/horses` serves `horses.html`) and sets long-lived cache headers on static assets.

Two ways to deploy:

- **GitHub integration:** import the repo at <https://vercel.com/new>, leave all build settings empty, and deploy.
- **CLI:** `npm i -g vercel && vercel` (first run links the project, subsequent runs deploy). Use `vercel --prod` for production.

For local development against Vercel's routing (clean URLs, headers), run `vercel dev` instead of `python3 -m http.server`.
