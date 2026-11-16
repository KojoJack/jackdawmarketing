# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the static marketing website for Jackdaw Marketing. There is no build step on the server, no dependencies, and no package manager: Netlify publishes the files exactly as they are. **Do not add React, Tailwind, npm, or a bundler.** Keep it plain HTML, CSS, and vanilla JS.

To preview: run any static file server from the repo root (e.g. `python3 -m http.server`). Paths are root-relative (`/assets/site.css`), so opening a file directly with `file://` will not load the styles.

The site deploys automatically to Netlify on every push to `main` — no manual deploy step needed.

After every edit, explain what was changed and why in plain language.

## Architecture

Pages: `index.html` (home), `/why/`, `/pricing/`, `/pricing/website/`, `/pricing/growth/`, `/the-vault/`, `404.html`, `thank-you.html`.

Every page shares two files:

- **`assets/site.css`** — all styles for every page: palette tokens, header, buttons, the homepage sections, the inner-page layouts, the contact form, the footer, the wordmark styles and the walking mascot.
- **`assets/site.js`** — behaviour every page needs: theme toggle, sticky bar, mobile menu, footer year, analytics events, and the idle walking mascot.

Page-specific code stays inline in that page: the homepage `<script>` (its `CONFIG` object, the wordmark, the shelf, the project preview overlay) and the Vault's password gate.

The header, footer and contact form are repeated as plain HTML in each page. They must stay identical across pages. A local helper script (`_local/jackdaw-v2-build.py`, not in git) regenerates all pages from one set of templates; if it is available use it rather than hand-editing eight copies, otherwise edit each page.

Homepage sections, in order: `header.bar`, `section.hero` (the wordmark, then the pitch), `.ticker` (one moving banner), `#work` (the shelf of sample sites), `#how` (four steps), `#why` (five rows linking to `/why/`), `#pricing` (both plans), `#contact` (the form), `footer`.

Sample sites live in `/work/<name>/` as self-contained single files with their own photos in `img/`. They are fictional businesses, carry `noindex`, and are shown on the homepage only by type ("Sample electrician"), never by their made-up names. Photo sources are recorded in `work/photo-credits.json`.

The Vault (`/the-vault/`) is a password gate over client previews in `/the-vault/<project>/`. Leave the project folders and the `VAULTS` list alone unless asked.

## Key conventions

- **Homepage content** — lives in the `CONFIG` object near the top of the homepage `<script>` (marked `EDIT ME`): `line1`/`line2` (the wordmark), `ticker` (banner items) and `projects` (the shelf). Do not scatter content changes elsewhere.
- **Palette** — CSS custom properties on `:root` in `assets/site.css`:
  - `--plum` `#221024` — page background (role, not a fixed color — see Light/dark mode)
  - `--cream` `#FCF3E3` — body text
  - `--marigold` `#FFC24B` — accents / highlights
  - `--jade` `#29C39A` — secondary accent
  - `--tomato` `#FF5535` — logo tile / CTA
- **Light/dark mode** — `--plum`/`--plum-2`/`--plum-3`/`--cream`/`--marigold`/`--jade`/`--tomato` are *role* tokens: their values flip under `:root[data-theme="light"]`. A tiny blocking script at the very top of each page's `<head>` sets `data-theme` from `localStorage["jackdaw-theme"]` (falling back to `prefers-color-scheme`) before first paint, to avoid a flash of the wrong theme. The header's sun/moon `.theme-toggle` button flips it and persists the choice.
  Four more tokens — `--brand-marigold`, `--brand-tomato`, `--brand-ink`, `--brand-paper` — never change with theme. Use them for anything that must look identical in both modes: the logo tile, the banner, and the fixed-marigold `#contact` section and everything inside it. When adding a new bright background or a light-colored element, check it renders under both themes before shipping.
- **Typography** — Archivo (variable width and weight) for display and body, Space Mono for small technical text. Headings use `font-stretch` up to 125% at weight 900.
- **The wordmark** — "JACKDAW MARKETING" as real text. Each letter sits in a fixed-width slot (`.ltr > .lift > .tw > .gl`) so restyling one never shifts its neighbours. Hovering or tapping a letter gives it a random style that no other letter is currently wearing; the 40 styles are the `.s1` to `.s40` rules in `assets/site.css`. The change plays a stepped, cyan-and-magenta glitch (`wm-glitch`). On touch screens the letters change by themselves. The style typefaces are loaded from Google Fonts with `&text=JACKDAWMRETING`, so only those thirteen letters are downloaded: if the wordmark text ever changes, update that parameter too.
- **The bird** — one pixel grid (23×16) drives every bird on the site: the header mark, the footer bird, the favicon, the mascots (laptop, envelope, padlock) and the walking mascot. In the helper script it is `BIRD` plus `POSES`; `assets/site.js` holds a copy as `GRID` for the walker. Keep them in step if the logo changes. Birds are inline SVG colored with `--bird-body` / `--bird-detail`, which flip with the theme (marigold on dark, plum on light) and are overridden inside `.contact`.
- **The walking mascot** — after six idle seconds the bird walks across the bottom of the screen; clicking it opens a speech bubble linking to the contact form. It is disabled with `data-walker="off"` on `<body>` (the thank-you page and the Vault), while someone is typing, while the form is on screen, and under reduced motion.
- **Contact form** — a Netlify form named `contact`, present at the bottom of the home, Why, Pricing and plan pages. Keep the `name="contact"`, `data-netlify`, honeypot and field names consistent across all copies.
- **Analytics** — Google Analytics loads only when the hostname is `jackdawmarketing.ca`, so previews and local testing are not counted.
- **SEO** — page titles, meta descriptions, canonical links and the homepage JSON-LD are deliberate. Do not change them, the URL structure, `robots.txt` or `sitemap.xml` without being asked.
- Responsive breakpoints are handled with `@media` queries and `clamp()`. The only layout JavaScript is the wordmark's fit-to-width sizing.
- `prefers-reduced-motion` is respected: the banner, the glitch, the shelf's pop-out, the walking mascot and all hover motion are disabled or bypassed when the OS preference is set.

## Review copy

A private review copy is published at `jackdaw-v2-preview.netlify.app` (a separate Netlify project, behind Netlify login, blocked from search engines). It is deployed by hand from `_local/jackdaw-v2/` and is not connected to this repo. Never copy its `_headers` or `robots.txt` to the live site: they tell search engines to stay away.
