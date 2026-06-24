# 🤰 Pregnancy Tracker

A beautiful, couple-shared Progressive Web App (PWA) to track your pregnancy journey — daily symptoms, medicines, mood, baby kicks, contractions, weight, and appointments across all 9 months.

Install it on iPhone via Safari "Add to Home Screen" and it works like a native app.

See [CHANGELOG.md](./CHANGELOG.md) for release history. Current version: **2.0.0**.

---

## Features

- **Daily Log** — Mood (emoji picker), symptoms (chip grid + severity sliders), water intake (visual glass tracker), sleep hours, medicines due that day (with times), free-form notes
- **Medicines** — Add medicines with timing and an optional course duration (e.g. "take for 1 week"); daily checklist with progress bar; completed courses move out of the way automatically; push notification reminders
- **Baby Kick Counter** — Tap to count kicks (with haptic feedback), automatic timer, weekly movement trend chart, session history
- **Contraction Timer** — Tap to start/stop each contraction; tracks duration and time since the previous one; surfaces a 🚨 alert when the classic 5-1-1 pattern (contractions ~5 min apart, ~1 min long, for an hour) is detected
- **Weight Tracker** — Log weight entries with a trend chart
- **Appointments** — Track upcoming prenatal visits, plus a Q&A section per appointment for pre-visit questions and the doctor's answers
- **Symptom Guide** — Static reference covering what's Normal, daily-management Tips, symptoms to Watch, and true Emergency signs
- **History** — Week or month calendar view; tap any day for the full log (mood, symptoms + severity, water, sleep, medicines, kicks, weight, notes); **export your entire history as a CSV** to share with your doctor or midwife
- **Partner Sharing** — Join code so both partners see the same pregnancy record
- **Forgot Password** — Self-service password reset via email
- **First-Time Welcome Tour** — New accounts get a short, skippable tour of the app on their first Dashboard visit; anyone can rewatch it any time from More → "Replay Welcome Tour"
- **PWA** — Installable on iPhone (iOS 16.4+) and Android, with a real branded icon (favicon, home-screen icon, Apple touch icon — generated from the app logo); offline banner when connectivity drops
- **Push Notifications** — Medicine reminders at configurable times (morning / afternoon / evening / night)

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Framework | Next.js 14.2.x (App Router, TypeScript) | Free |
| Styling | Tailwind CSS | Free |
| Icons | Lucide React | Free |
| Charts | Recharts | Free |
| Auth + Database | Supabase (PostgreSQL + RLS) | Free tier |
| Hosting | Vercel | Free hobby tier |
| Tests | Vitest | Free |
| CI | GitHub Actions (unit tests + type check + build + Lighthouse audit) | Free |

> **Node.js 20+ is required** (Next.js 14 requires Node ≥18.17, and Node 18 is past end-of-life — go straight to 20 LTS). Run `node --version` to check; upgrade if you're below that.

---

## Setup

### 1. Supabase — Create Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Copy your **Project URL** and **anon public key** from **Project Settings → API**
4. Under **Authentication → URL Configuration**, set your **Site URL** to your production domain and add it (with `/**`) to **Redirect URLs** — required for signup confirmation and password reset emails to link back correctly
5. *(Optional but recommended before real use)* Under **Authentication → Settings → SMTP Settings**, configure a real email provider (Resend, SendGrid, Postmark, etc.). Supabase's built-in email sender is rate-limited to a handful of emails per hour — fine for testing, not for real signups/password resets

### 2. Environment Variables

Create `.env.local` in the project root (use UTF-8 encoding — see note below):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

> **Windows PowerShell note:** Do not use `echo` or `>>` to write this file — PowerShell defaults to UTF-16 LE and Next.js won't read the vars. Use:
> ```powershell
> [System.IO.File]::WriteAllText("$PWD\.env.local", "NEXT_PUBLIC_SUPABASE_URL=...", [System.Text.Encoding]::UTF8)
> ```

### 3. Production URL

`lib/config.ts` exports a hardcoded `SITE_URL` used for auth email redirects (signup confirmation, password reset). Update it to match your actual production domain — it intentionally does **not** use `window.location.origin`, so links in emails always point to production even if the email was triggered from local dev or a preview deploy.

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

```bash
npm test            # run once
npm run test:watch  # watch mode
npm run test:coverage
```

Unit tests (Vitest) cover the pure logic: pregnancy week/due-date math, medicine course-duration status, CSV escaping, and type shape checks. UI is not unit tested — verify manually or with the `/verify` flow if using Claude Code.

---

## Vercel Deployment

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Add environment variables in Vercel dashboard under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — every `git push` to `master` will auto-deploy
5. If **Deployment Protection** is enabled for preview deployments (common default), generate a **Protection Bypass for Automation** secret (Vercel → Project Settings → Deployment Protection) so CI's Lighthouse audit can actually reach preview URLs instead of hitting Vercel's login wall — see the CI section below

---

## iPhone PWA Install

1. Open your Vercel URL in **Safari** on iPhone
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. The app icon appears on your home screen — it opens full screen, no browser UI

> Push notifications require iOS 16.4+ with the app added to the home screen.

---

## Partner Sharing

1. **Primary partner** signs up → completes onboarding (sets LMP date, baby name)
2. A **6-character join code** is displayed on the Dashboard (also visible in More → Pregnancy Settings)
3. **Second partner** signs up → on the onboarding screen, choose **"Join partner's pregnancy"** and enter the code
4. Both accounts now share the same pregnancy record and see the same daily logs, medicines, kicks, contractions, and history

---

## Medicine Reminders (Push Notifications)

1. Go to **Medicines** page
2. Tap **"Enable Notifications"** when the banner appears
3. Set reminder times per medicine (Morning 8am / Afternoon 1pm / Evening 6pm / Night 9pm), and optionally a course duration (3 days / 5 days / 1 week / 2 weeks / 1 month / Ongoing)
4. Notifications fire while the app is open or running in the background (PWA installed on home screen); medicines whose course has ended stop triggering reminders and move to a "Completed Courses" section

> Notifications use the Web Notifications API + a Service Worker. They work on iOS 16.4+ (home screen PWA) and all modern Android/desktop browsers.

---

## GitHub Actions CI

The `.github/workflows/ci.yml` runs on every push and pull request:

1. **Unit Tests** — `npm test` (Vitest)
2. **Build & Type Check** — `tsc --noEmit` then `npm run build` (needs `test` to pass first)
3. **Lighthouse audit** (PRs only) — waits for the Vercel preview URL, bypasses Vercel Deployment Protection using a generated bypass header, then audits with thresholds:
   - Accessibility ≥ 90 (error)
   - Performance ≥ 70 (warning)
   - PWA ≥ 60 (warning)

### Required GitHub Secrets

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `VERCEL_PROTECTION_BYPASS` | Vercel → Project Settings → Deployment Protection → "Protection Bypass for Automation" (only needed if Deployment Protection is on) |

---

## Project Structure

```
app/
  (auth)/
    layout.tsx        # Wraps auth pages in a <main> landmark
    login/            # Sign in page
    signup/           # Sign up page
    forgot-password/  # Request a password reset email
    reset-password/   # Set a new password from the email link (PKCE code exchange)
  (app)/
    layout.tsx        # App shell: header + offline banner + bottom nav
    error.tsx         # Friendly error boundary for the authenticated app
    page.tsx           # Dashboard (redirect to /dashboard)
    dashboard/         # Week card, fruit size, countdown, quick actions, welcome tour
    log/                # Daily log: mood, medicines (with times), symptoms, water, sleep, notes
    medicines/          # Add medicines, course duration, daily checklist, notification setup
    kicks/              # Baby kick counter with timer, weekly trend chart, haptics
    contractions/       # Contraction timer with 5-1-1 pattern detection
    weight/             # Weight entry + trend chart
    appointments/       # Add/list appointments + per-appointment Q&A
    guide/               # Static symptom reference (Normal / Tips / Watch / Emergency)
    history/             # Calendar + full day detail panel + CSV export
    onboarding/          # LMP setup or join partner
    settings/            # Edit baby name, LMP/due date, profile
  robots.ts              # Disallows all crawling -- private health-data app
components/
  AppHeader.tsx         # Fixed frosted glass header
  BottomNav.tsx         # iOS-style tab bar
  OfflineBanner.tsx     # Shows when the device loses connectivity
  WelcomeTour.tsx       # First-time-user slide tour
  EmojiMoodPicker.tsx
  WaterGlasses.tsx      # Visual glass-fill water tracker
  ChipGrid.tsx          # Symptom chip selector
  ui/card.tsx           # Glass morphism card
lib/
  supabase/
    client.ts          # Browser Supabase client (PKCE flow)
    server.ts           # Server-side Supabase client (RSC / API routes)
  config.ts              # SITE_URL -- hardcoded production domain for auth redirects
  pregnancy.ts            # Week calc, due date, fruit sizes, SYMPTOMS list
  medicine.ts              # Course duration status (ongoing/ended/days left)
  notifications.ts          # Medicine reminder scheduling
  haptics.ts                 # navigator.vibrate wrapper
  csv.ts                      # CSV escaping + download helper
  utils.ts                     # cn() helper
__tests__/                      # Vitest unit tests
public/
  manifest.json                 # PWA manifest
  sw.js                          # Service worker for push notifications
  icons/                          # Favicon, PWA icons, Apple touch icon (generated from logo-source.png)
supabase/
  schema.sql                     # Full database schema with RLS policies
middleware.ts                    # Auth guard -- redirects to /login if not signed in
```

---

## Local Development Tips

- Supabase dashboard → **Table Editor** lets you browse and edit records
- Use **Authentication → Users** to see signed-up accounts
- The service worker only activates in production build. For dev, run `npm run build && npm start`
- Tailwind purges unused classes at build time — dynamic color class names are safelisted in `tailwind.config.ts`
- PostCSS config must be `postcss.config.js` (CommonJS) — Next's webpack CSS pipeline loads it via `require()`, which silently fails on `.mjs` ESM config files and falls back to a no-op pass-through (Tailwind directives never get compiled)
- `middleware.ts`'s matcher must explicitly exclude any file-based metadata route (`app/icon.png`, `app/robots.ts`, future `sitemap.ts`, etc.) — otherwise unauthenticated requests for them get redirected to `/login`, which silently breaks the favicon and `robots.txt`
- If `metadata.icons` is set at all (e.g. for `apple`), Next's automatic file-convention detection of `app/icon.png` is suppressed — `icon` must be listed explicitly in that same object or no `<link rel="icon">` tag is emitted
- Browsers cache favicons very aggressively — after changing icon files, a normal refresh often isn't enough; use a hard refresh or a fresh private/incognito window to verify

---

## License

MIT
