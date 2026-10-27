# Gabby Astrologia — site

A small, fast, mobile-first site in Brazilian Portuguese where Gabby's clients learn how a reading works and book directly through Cal.com. It's built with Astro as a static site and hosted on Cloudflare Pages. It's ready for English, but English is switched off.

## Local development

Needs Node 24+.

```sh
npm install
npm run dev          # http://localhost:4321, with placeholders visible
npm run build        # production build into dist/ (placeholders hidden, then checked)
```

## Where to edit things

| What | Where |
| --- | --- |
| All text (headings, buttons, FAQ, testimonials, alt text, page titles, disclaimer, privacy note) | `src/content/site.pt-BR.json` |
| Cal.com link, Instagram, WhatsApp, privacy email, site URL, analytics token, photo file names | `src/content/settings.json` |
| Colors, fonts, spacing | `src/styles/tokens.css` |
| Photos | `src/assets/photos/` |

No component contains text: `npm run lint:text` fails the build if one does. Both JSON files are validated when the site builds, so a misspelled key or a malformed WhatsApp number stops the build with a message saying what's wrong.

### Placeholders (`[[PREENCHER: …]]`)

Anything still unknown is marked `[[PREENCHER: …]]`. To list what's still open:

```sh
npm run placeholders
```

- **Preview builds** (`npm run dev`, Cloudflare preview branches, or `SHOW_PLACEHOLDERS=1`) show placeholders as-is, plus a lavender banner with the count.
- **Production builds** leave out anything that still has a placeholder: a testimonial, an FAQ answer, the price, a bio paragraph, or a whole section if all of its items are unfilled. A WhatsApp or Instagram button stays hidden until its setting is filled in.
- **Launch builds** (the `main` branch on Cloudflare, or `LAUNCH=1`) fail if `calLink` or `contactEmail` is still a placeholder.

Never invent testimonials, credentials or client stories. Only add quotes Gabby has written permission to use.

### Swapping photos

1. Put the photo in `src/assets/photos/`, for example `gabby-hero.jpg`. Use JPG or PNG, at least 1200px on the long side.
2. Make sure the file name matches `photos.hero` / `photos.about` in `settings.json`.
3. Update the alt text in `site.pt-BR.json` (`home.hero.photoAlt`, `about.photoAlts`).

Astro resizes the photos and converts them to modern formats. Until a photo exists, a zodiac-wheel drawing stands in.

### Share image and icons

`public/og-default.png` (1200×630, used by WhatsApp and Instagram link previews) and `public/apple-touch-icon.png` are generated from the site name and colors. After changing the name or tagline, run `npm run images`. `public/favicon.svg` is drawn by hand.

## How to turn on English

The structure is already in place. Pages, routes, the switcher and the `hreflang` tags all come from the same templates.

1. Copy `src/content/site.pt-BR.json` to `src/content/site.en.json`.
2. Translate every value. Set `language` to `{ "code": "en", "name": "English", "short": "EN", "ogLocale": "en_US" }` and translate the slugs in `routes` (for example `about`, `contact`, `privacy`, `book`).
3. Add `"en"` to `enabledLocales` in `settings.json`.
4. Optional: if English bookings need their own Cal.com event, add `"en": "user/event"` under `calLink`. It defaults to the Portuguese link.
5. Run `npm run qa`, then deploy.

The build then produces `/en`, `/en/about`, … , a PT/EN switcher in the header that keeps the visitor on the equivalent page, `<html lang>` per page, `hreflang` alternates (`pt-BR`, `en`, `x-default` → Portuguese), English share titles, and English entries in the sitemap. The test suite already proves this with a stub English file (`tests/fixtures/content/site.en.json`).

## Quality checks

| Command | What it checks |
| --- | --- |
| `npm run check` | TypeScript / Astro type check |
| `npm run lint:text` | No hard-coded text in `.astro` files |
| `npm run test:unit` | i18n helpers, placeholder rules, schemas, wa.me encoding, WCAG contrast of the palette, the text guard itself |
| `npm run build` | Production build, then `scripts/check-dist.mjs`: broken links/anchors, missing meta/OG tags, leaked placeholders |
| `npm run test:e2e` | Builds a test site (fake but valid links from `tests/fixtures/settings.json`) and a test site with English on, then runs Playwright on mobile Chromium at 360px, iPhone WebKit and desktop Chromium: every page renders, booking is one tap away, Cal.com inline/popup and their fallbacks, WhatsApp/Instagram links, FAQ keyboard access, share tags, sitemap/robots, 404, axe-core accessibility, and the English switch-on |
| `npm run lighthouse` | Lighthouse mobile ≥ 90 for performance, accessibility and SEO (run after `test:e2e`, which builds `dist-test`) |
| `npm run qa` | All of the above |

The first time, install the test browsers with `npx playwright install chromium webkit`. GitHub Actions (`.github/workflows/ci.yml`) runs the full suite on every push and pull request.

Cal.com is never contacted during tests: its script is replaced by a stub, or blocked to exercise the fallbacks. A real test booking is a manual launch step (below).

## Deploys (Cloudflare Pages)

1. Push the repo to GitHub.
2. In Cloudflare: Workers & Pages → Create → Pages → **Connect to Git** → pick the repo.
3. Framework preset **Astro**, build command `npm run build`, output directory `dist`. Set the environment variable `NODE_VERSION=24`.
4. Every push to `main` deploys production. Other branches get preview URLs, with placeholders visible, for Gabby to review.
5. Custom domains → add the domain. Cloudflare sets up DNS and HTTPS. Then update `siteUrl` in `settings.json`.
6. Turn on Web Analytics for the site. Either let Cloudflare inject the beacon automatically, or paste the token into `analyticsToken`.

## Accounts setup checklist (all new)

- [ ] **GitHub**: create the repo `gabby-astrologia-site` and push (`git remote add origin …`, then `git push -u origin main`).
- [ ] **Cal.com** (Gabby's account): connect Google Calendar and Google Meet. Create one event type: 2h, Google Meet location, booking questions for birth date, time and city. Set availability and the language to Portuguese. Copy `user/event` into `calLink`.
- [ ] **Domain**: buy one through Cloudflare Registrar or any registrar (a `.com.br` needs a CPF/CNPJ).
- [ ] **Cloudflare**: create Gabby's account and add the developer as a member. Set up Pages (above) and Web Analytics.

## Before launch (manual)

- [ ] `npm run placeholders` shows nothing important left open
- [ ] Book a real test reading: a Google Calendar event with a Meet link is created, then cancel it
- [ ] Paste the URL into WhatsApp: the preview shows the share image and the Portuguese title
- [ ] On a phone, the WhatsApp and Instagram buttons open a chat with Gabby
- [ ] The custom domain loads over HTTPS

## Project layout

```
src/content/        settings.json, site.pt-BR.json   ← edit these
src/i18n/           locales, routes, t(), schemas
src/lib/            settings loader, placeholder rules, link builders
src/pages/          [...slug].astro (every page, every locale), 404, robots.txt
src/templates/      HomePage, AboutPage, ContactPage, PrivacyPage
src/components/     Header, Footer, BookButton, CalInline, Photo, art/
src/scripts/cal.ts  Cal.com embed loader (inline + popup + fallback)
scripts/            QA scripts, image generator, test server
tests/              unit (Vitest), e2e (Playwright), fixtures
content-inbox/      raw material from Gabby (not committed)
```
