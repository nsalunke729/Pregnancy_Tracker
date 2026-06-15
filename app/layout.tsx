import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pregnancy Tracker',
  description: 'Track your pregnancy journey day by day',
  manifest: '/manifest.json',
  themeColor: '#f43f5e',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pregnancy Tracker',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
