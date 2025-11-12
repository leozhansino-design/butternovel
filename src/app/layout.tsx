// src/app/layout.tsx
import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'  // ⚠️ 暂时禁用 Google Fonts（网络限制）
import './globals.css'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import HeaderWrapper from '@/components/shared/HeaderWrapper'
import ConditionalHeader from '@/components/shared/ConditionalHeader'

// const inter = Inter({ subsets: ['latin'] })

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
      <body className="font-sans">{/* 使用系统字体 */}
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