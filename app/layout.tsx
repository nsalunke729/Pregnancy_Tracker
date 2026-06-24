import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pregnancy Tracker',
  description: 'Track your pregnancy journey day by day',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pregnancy Tracker',
  },
  icons: {
    // Explicit icon entries -- an explicit `icons` object suppresses Next's
    // file-convention auto-detection of app/icon.png, so it must be listed
    // here too or no <link rel="icon"> tag gets emitted at all.
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  // Next's appleWebApp.capable only emits the legacy apple-prefixed meta tag;
  // browsers now want this standard one too.
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f43f5e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
