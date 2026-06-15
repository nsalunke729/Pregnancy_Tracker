# 🤰 Pregnancy Tracker

A beautiful, couple-shared Progressive Web App (PWA) to track your pregnancy journey — daily symptoms, medicines, mood, baby kicks, weight, and appointments across all 9 months.

Install it on iPhone via Safari "Add to Home Screen" and it works like a native app.

---

## Features

- **Daily Log** — Mood (emoji picker), symptoms (chip grid + severity sliders), water intake, sleep hours, free-form notes
- **Medicines** — Add medicines with timing; daily checklist with progress bar; push notification reminders
- **Baby Kick Counter** — Tap to count kicks, automatic timer, session history
- **Weight Tracker** — Log weight entries with a trend chart
- **Appointments** — Track upcoming prenatal visits
- **History** — Calendar view; tap any day to see the full log: mood, symptoms + severity bars, water, sleep, medicines (taken / not taken), kick sessions, weight, notes
- **Partner Sharing** — Join code so both spouses see the same pregnancy record
- **PWA** — Installable on iPhone (iOS 16.4+) and Android; works offline for browsing
- **Push Notifications** — Medicine reminders at configurable times (morning / afternoon / evening / night)

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Framework | Next.js 13.5.6 (App Router, TypeScript) | Free |
| Styling | Tailwind CSS | Free |
| Icons | Lucide React | Free |
| Charts | Recharts | Free |
| Auth + Database | Supabase (PostgreSQL + RLS) | Free tier |
| Hosting | Vercel | Free hobby tier |
| CI | GitHub Actions (type check + Lighthouse audit) | Free |

> Next.js is pinned to **13.5.6** for compatibility with Node 18.15. Upgrade Node to 18.17+ to unlock Next.js 14.

---

## Setup

### 1. Supabase — Create Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Copy your **Project URL** and **anon public key** from **Project Settings → API**

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

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Vercel Deployment

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Add environment variables in Vercel dashboard under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — every `git push` to `main` will auto-deploy

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
2. A **6-character join code** is displayed on the onboarding screen (also visible in Settings)
3. **Second partner** signs up → on the onboarding screen, choose **"Join partner's pregnancy"** and enter the code
4. Both accounts now share the same pregnancy record and see the same daily logs, medicines, and history

---

## Medicine Reminders (Push Notifications)

1. Go to **Medicines** page
2. Tap **"Enable Notifications"** when the banner appears
3. Set reminder times per medicine (Morning 8am / Afternoon 1pm / Evening 6pm / Night 9pm)
4. Notifications fire while the app is open or running in the background (PWA installed on home screen)

> Notifications use the Web Notifications API + a Service Worker. They work on iOS 16.4+ (home screen PWA) and all modern Android/desktop browsers.

---

## GitHub Actions CI

The `.github/workflows/ci.yml` runs on every push and pull request:

1. **Type check** — `tsc --noEmit`
2. **Build** — `npm run build`
3. **Lighthouse audit** (PRs only) — waits for Vercel preview URL, then audits with thresholds:
   - Accessibility ≥ 90 (error)
   - Performance ≥ 70 (warning)
   - PWA ≥ 60 (warning)

### Required GitHub Secrets (for Lighthouse)

Add these in **GitHub → Settings → Secrets → Actions**:

| Secret | Where to find it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel.json` or Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project settings |

---

## Project Structure

```
app/
  (auth)/
    login/          # Sign in page
    signup/         # Sign up page
  (app)/
    layout.tsx      # App shell: header + bottom nav
    page.tsx        # Dashboard (redirect to /dashboard)
    dashboard/      # Week card, fruit size, countdown, quick actions
    log/            # Daily log: mood, medicines checklist, symptoms, water, sleep, notes
    medicines/      # Add medicines, daily checklist, notification setup
    kicks/          # Baby kick counter with timer
    weight/         # Weight entry + trend chart
    appointments/   # Add and list appointments
    history/        # Calendar + full day detail panel
    onboarding/     # LMP setup or join partner
    settings/       # Profile, join code, sign out
components/
  AppHeader.tsx     # Fixed frosted glass header
  BottomNav.tsx     # iOS-style tab bar
  EmojiMoodPicker.tsx
  ChipGrid.tsx      # Symptom chip selector
  ui/card.tsx       # Glass morphism card
lib/
  supabase/
    client.ts       # Browser Supabase client
    server.ts       # Server-side Supabase client (RSC / API routes)
  pregnancy.ts      # Week calc, due date, fruit sizes, SYMPTOMS list
  notifications.ts  # Medicine reminder scheduling
  utils.ts          # cn() helper
public/
  manifest.json     # PWA manifest
  sw.js             # Service worker for push notifications
supabase/
  schema.sql        # Full database schema with RLS policies
middleware.ts       # Auth guard — redirects to /login if not signed in
```

---

## Local Development Tips

- Supabase dashboard → **Table Editor** lets you browse and edit records
- Use **Authentication → Users** to see signed-up accounts
- The service worker only activates in production build. For dev, run `npm run build && npm start`
- Tailwind purges unused classes at build time — dynamic color class names are safelisted in `tailwind.config.ts`

---

## License

MIT
