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
  title: 'ButterNovel - Free Novels',
  description: 'Discover millions of novels for free. Read anytime, anywhere.',
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