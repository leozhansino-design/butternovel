// src/app/layout.tsx
import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'  // ⚠️ 暂时禁用 Google Fonts（网络限制）
import './globals.css'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { SessionProvider } from 'next-auth/react'
import ClientHeaderWrapper from '@/components/shared/ClientHeaderWrapper'
import ConditionalHeader from '@/components/shared/ConditionalHeader'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'),

  title: {
    default: 'ButterNovel - Free Novels Online',
    template: '%s | ButterNovel',
  },

  description: 'Discover millions of novels for free. Read fantasy, romance, sci-fi, and more. Join our community of readers and writers.',

  keywords: [
    'free novels',
    'online novels',
    'web novels',
    'fantasy novels',
    'romance novels',
    'sci-fi novels',
    'read novels online',
    'free reading',
    'butternovel',
  ],

  authors: [{ name: 'ButterNovel' }],

  creator: 'ButterNovel',
  publisher: 'ButterNovel',

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'ButterNovel',
    title: 'ButterNovel - Free Novels Online',
    description: 'Discover millions of novels for free. Read fantasy, romance, sci-fi, and more.',
    images: [
      {
        url: '/og-image.png', // 需要在 /public 目录添加此图片
        width: 1200,
        height: 630,
        alt: 'ButterNovel - Free Novels Online',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@butternovel',
    creator: '@butternovel',
    title: 'ButterNovel - Free Novels Online',
    description: 'Discover millions of novels for free. Read fantasy, romance, sci-fi, and more.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  manifest: '/site.webmanifest',

  verification: {
    google: 'your-google-verification-code', // 需要在 Google Search Console 获取
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
}

/**
 * Root Layout
 *
 * ⚡ CRITICAL FIX: Removed server-side `await auth()` call
 *
 * Previously: Used HeaderWrapper which called `await auth()`
 * - This forced ALL pages to be dynamically rendered
 * - Cache-Control: no-cache, no-store
 * - ISR completely disabled
 *
 * Now: Uses ClientHeaderWrapper with useSession() hook
 * - Session fetched client-side
 * - Pages can be statically generated
 * - ISR works properly with revalidate settings
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{/* 使用系统字体 */}
        <SessionProvider>
          {/* ✅ Client-side header - doesn't force dynamic rendering */}
          <ConditionalHeader>
            <ClientHeaderWrapper />
          </ConditionalHeader>

          {children}

          <Analytics />
          <SpeedInsights />
        </SessionProvider>
      </body>
    </html>
  )
}