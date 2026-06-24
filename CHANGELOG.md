# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Fixed

- **Favicon and `robots.txt` were silently redirected to `/login`** — the auth middleware's matcher didn't exclude the routes Next.js auto-generates from `app/icon.png` and `app/robots.ts`; unauthenticated requests for either got a 307 to the login page instead of the real content
- **No `<link rel="icon">` tag was emitted at all** — an explicit `metadata.icons` object (set for `apple`) suppresses Next's automatic file-convention detection of `app/icon.png`; it now has to be listed there explicitly too
- **Zoom was disabled site-wide** (`userScalable: false`, `maximumScale: 1`) — fails WCAG 1.4.4; removed
- **Low-contrast text app-wide** — the primary `Button` component (white text on `rose-500`, ~3.74:1) and every other `text-rose-500`/`text-green-500` usage rendering as real text (not decorative icon tinting) failed the 4.5:1 minimum; darkened to `rose-600`/`700`/`800` and `green-700`
- Missing `autocomplete` attributes on email/password/name inputs across all auth pages
- Deprecated `apple-mobile-web-app-capable` meta tag — added the modern `mobile-web-app-capable` tag alongside it

## [2.0.0] — 2026-06-25

A major milestone covering everything built since the initial 0.1.0 release: new tracking features, critical infrastructure fixes, and a real test suite.

### Added

- **Contraction Timer** — tap to start/stop each contraction; tracks duration and time since the previous one; surfaces a 🚨 alert when the classic 5-1-1 pattern (~5 min apart, ~1 min long, sustained for an hour) is detected
- **Symptom Guide** — static reference covering Normal symptoms, daily-management Tips, symptoms to Watch, and true Emergency signs
- **Appointment Q&A** — pre-visit questions and the doctor's answers, tracked per appointment
- **Medicine course duration** — set a medicine to run for a fixed period (3 days / 1 week / 2 weeks / 1 month / Ongoing); completed courses move out of the active list and stop triggering reminders automatically
- **Medicine times in Daily Log** — the Log page now shows when each medicine is due (Morning/Afternoon/Evening/Night), not just dosage
- **Kick weekly trend chart** — a 7-day bar chart of total kicks per day on the Kicks page
- **Haptic feedback** — short vibration on each kick tap, distinct pattern at the 10-kick goal
- **Water glass visual** — the water tracker on the Log page now shows a glass-fill row instead of a plain number stepper
- **CSV export** — export the entire pregnancy log history (mood, water, sleep, weight, symptoms, medicines, kicks, notes) as a CSV from the History page, to share with a doctor or midwife
- **Forgot / reset password** — full self-service flow: request a reset email, set a new password from the link
- **First-time welcome tour** — new accounts get a short, skippable slide tour on their first Dashboard visit; replayable any time from More → "Replay Welcome Tour"
- **Offline banner** — shown when the device loses connectivity
- **Error boundary** — friendly "Couldn't load this page" screen instead of a blank one on unexpected errors
- **Real app icons** — favicon, PWA home-screen icons (192/512), and Apple touch icon, generated from an actual logo (previously referenced files that didn't exist)
- **Unit test suite** (Vitest) — 35 tests covering pregnancy date math, medicine course-duration status, CSV escaping, and type shapes
- **CI pipeline** — GitHub Actions now runs unit tests before type-check/build, and Lighthouse audits real preview deployments (previously blocked by Vercel's deployment protection wall)

### Fixed

- **Tailwind CSS was never compiling in production** — `postcss.config.mjs` (an ES module) silently failed to load in Next's webpack CSS pipeline, which falls back to a no-op pass-through; every Tailwind utility class did nothing on the live site. Fixed by switching to CommonJS `postcss.config.js`
- **Password reset email linked to localhost** — auth redirect URLs were built from `window.location.origin`, which resolves to wherever the request was actually made (including local dev); now uses a hardcoded `SITE_URL` constant
- **Password reset link silently failed** — the reset page assumed the implicit auth flow, but `createBrowserClient` defaults to PKCE (a `?code=` param), which needs an explicit `exchangeCodeForSession()` call
- **Lighthouse CI was auditing Vercel's login page, not the app** — preview deployments require Vercel authentication; added a protection-bypass header so Lighthouse reaches the real preview
- **Medicine reminders could silently stop working** in storage-restricted PWA contexts (private browsing) — `localStorage` access is now wrapped in try/catch
- **Contraction duration under-recorded** when the app was backgrounded mid-contraction — now computed from wall-clock time at stop, not the throttled timer state
- **5-1-1 pattern detection could never actually fire** — was checking a fixed 6-contraction slice, which can't span the required 60-minute window; now uses a trailing time window instead
- Emoji/icon misalignment across Guide, Dashboard, and other pages (missing `flex-shrink-0` / `min-w-0` on flex children)
- Missing `<main>` landmark on login/signup pages, missing `robots.txt`, theme color not applying after the Next.js 14 upgrade (deprecated `metadata.themeColor` API)

### Changed

- **Next.js 13.5.6 → 14.2.34**, **Node 18 → 20 LTS required** — closes a security advisory affecting unpatched Next.js releases; Node 18 is also past end-of-life
- Dashboard, History, More, and Medicines pages reorganized for a more compact layout

---

## [0.1.0] — Initial release

Core PWA: daily log (mood, symptoms, water, sleep, notes), medicines with reminders, kick counter, weight tracker, appointments, history calendar, partner sharing via join code, push notifications.
