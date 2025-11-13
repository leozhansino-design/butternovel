// src/components/shared/ClientHeaderWrapper.tsx
'use client'

import { useSession } from 'next-auth/react'
import Header from './Header'

/**
 * Client-side header wrapper that uses useSession() hook
 *
 * ✅ This does NOT force the page to be dynamic
 * ✅ Session is fetched client-side after initial render
 * ✅ Works with Next.js ISR and static generation
 *
 * Previously: HeaderWrapper used `await auth()` on server → forced dynamic rendering
 * Now: Uses client-side `useSession()` → pages can be statically cached
 */
export default function ClientHeaderWrapper() {
  const { data: session } = useSession()

  return <Header user={session?.user} />
}
