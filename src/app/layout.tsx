// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import HeaderWrapper from '@/components/shared/HeaderWrapper'
import ConditionalHeader from '@/components/shared/ConditionalHeader'

export const metadata: Metadata = {
  title: 'ButterNovel - Free Novels',
  description: 'Discover millions of novels for free. Read anytime, anywhere.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* ✅ 用 ConditionalHeader 包裹 HeaderWrapper */}
        <ConditionalHeader>
          <HeaderWrapper />
        </ConditionalHeader>
        
        {children}
        
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}