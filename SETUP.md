# Pregnancy Tracker — Setup Guide

## 1. Supabase Setup (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** → paste the entire contents of `supabase/schema.sql` → click **Run**
4. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon` / `public` key

## 2. Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to sign up.

## 4. Deploy to Vercel (Free)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import → select the repo
3. Add environment variables (same as `.env.local`) in Vercel dashboard
4. Deploy → get a live URL like `https://pregnancy-tracker-xxx.vercel.app`

## 5. Install on iPhone (PWA)

1. Open the Vercel URL in **Safari** on iPhone
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add** — it now works like a native app!

## 6. Partner Access

After signing up:
- One person creates the pregnancy (LMP date → onboarding)
- Go to **Dashboard** → see the **Partner Code** (6-char code)
- Partner signs up → chooses "Join partner's pregnancy" → enters the code
- Both now share the same pregnancy data in real-time

## App Routes

| Route | Screen |
|---|---|
| `/dashboard` | Home — week, fruit size, countdown |
| `/log` | Daily log — symptoms, mood, water, sleep |
| `/medicines` | Medicine checklist |
| `/kicks` | Baby kick counter |
| `/weight` | Weight tracker + chart |
| `/appointments` | Doctor appointments |
| `/history` | Calendar history view |
| `/more` | Settings, sign out |

## Icon Files (Optional — for home screen icon)

Add these PNG files to `public/icons/`:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)
- `apple-touch-icon.png` (180×180 px)

Use the `public/icons/icon.svg` as a template and export to PNG.
