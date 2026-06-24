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
