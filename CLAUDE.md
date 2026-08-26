# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a single-file static marketing website for JackDaw Marketing (`index.html`). There is no build step, no dependencies, and no package manager — everything is self-contained in one HTML file. **Do not add React, Tailwind, npm, or a bundler.** Keep it plain HTML, CSS, and vanilla JS.

To preview: open `index.html` in a browser, or run any static file server (e.g. `python3 -m http.server`).

The site deploys automatically to Netlify on every push to `main` — no manual deploy step needed.

After every edit, explain what was changed and why in plain language.

## Architecture

The entire site lives in `index.html` and is split into three logical parts:

1. **`<head>`** — Inline `<style>` block with all CSS. Uses CSS custom properties defined on `:root` for the color palette (`--plum`, `--cream`, `--marigold`, `--jade`, `--tomato`) and typography (`--display`, `--body`, `--mono`).

2. **`<body>`** — Semantic HTML sections: `header.bar` (sticky nav), `section.hero` (canvas wordmark + pitch), ticker strip, `#work` (project grid), `#why` (condensed Why JackDaw teaser boxes + pricing teaser, both linking out), `#contact`, `footer`. The full Why JackDaw writeup lives on its own page at `/why/index.html` (same self-contained-file pattern as `/pricing/index.html`), not inline on the homepage.

3. **`<script>`** — Vanilla JS with two distinct zones:
   - **`CONFIG` object** (marked `EDIT ME`) — the only part that needs updating for content changes: `line1`/`line2` (wordmark text), `email`, `links`, `ticker` items, and `projects` array.
   - **Engine code** — handles DOM wiring (contact, ticker, cards), scroll reveal via `IntersectionObserver`, sticky bar, and the canvas particle wordmark animation (spring-physics blocks that scatter and reform on pointer interaction).

## Key conventions

- All content customization happens inside the `CONFIG` object near the top of the `<script>` block. Do not scatter content changes elsewhere.
- **Palette** — defined as CSS custom properties on `:root` and mirrored in the JS `C` object (read live via `readThemeColors()`, not hardcoded). Keep both in sync if colors change:
  - `--plum` `#221024` — page background (role, not a fixed color — see Light/dark mode)
  - `--cream` `#FCF3E3` — body text
  - `--marigold` `#FFC24B` — accents / highlights
  - `--jade` `#29C39A` — secondary accent
  - `--tomato` `#FF5535` — logo eye / CTA
- **Light/dark mode** — `--plum`/`--plum-2`/`--plum-3`/`--cream`/`--marigold`/`--jade`/`--tomato` are *role* tokens: their values flip under `:root[data-theme="light"]` (defined right after the base `:root` block in every page). A tiny blocking script at the very top of `<head>` sets `data-theme` from `localStorage["jackdaw-theme"]` (falling back to `prefers-color-scheme`) before first paint, to avoid a flash of the wrong theme. The header's sun/moon `.theme-toggle` button flips it and persists the choice.
  Four more tokens — `--brand-marigold`, `--brand-tomato`, `--brand-ink`, `--brand-paper` — never change with theme. Use them (not the role tokens) for anything that must look identical in both modes: the logo mark, the ticker strip, the `#contact`/`.cta-band` fixed-marigold sections and everything inside them (inputs, `.btn.dark`, the big bird SVG), and any mascot image that isn't already wrapped in an `.outline-*`/drop-shadow filter for legibility. When adding a new bright-accent background or a light-colored image/icon on the page body, check it renders under both themes before shipping — a light PNG with no outline will disappear against a light page background.
- **Hero canvas** — the wordmark is a particle system: text is rasterised off-screen, sampled into a grid of spring-physics blocks, and drawn each frame. Pointer interaction scatters the blocks. Its color palette re-reads the CSS custom properties on theme toggle (`window.refreshWordmarkPalette`). Be conservative when editing this section; small changes to the physics constants can break the animation feel.
- **Logo bird** — inline SVG pixel art made of `<rect>` elements on a 20×16 grid. It appears in three places: the `<link rel="icon">` favicon, the `<header>` mark, and the large bird in `#contact`. Keep all three in sync if the logo changes.
- Responsive breakpoints are handled entirely with `@media` queries and `clamp()` — no JS layout logic.
- `prefers-reduced-motion` is respected: the ticker animation, scroll reveals, and canvas physics are all disabled or bypassed when the OS preference is set.
