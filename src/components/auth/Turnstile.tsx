// src/components/auth/Turnstile.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: TurnstileOptions
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

interface TurnstileOptions {
  sitekey: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
}

interface TurnstileProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  className?: string
}

export default function Turnstile({
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const scriptLoadedRef = useRef(false)

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || !siteKey) return
    if (widgetIdRef.current) return // Already rendered

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onError,
        theme,
        size,
      })
    } catch (error) {
      console.error('Turnstile render error:', error)
    }
  }, [siteKey, onVerify, onExpire, onError, theme, size])

  useEffect(() => {
    // If Turnstile is disabled (no site key), skip loading
    if (!siteKey) {
      console.warn('Turnstile site key not configured, skipping verification')
      return
    }

    // Check if script is already loaded
    if (window.turnstile) {
      renderWidget()
      return
    }

    // Check if script tag already exists
    if (document.querySelector('script[src*="turnstile"]')) {
      // Script exists but not loaded yet, wait for it
      window.onTurnstileLoad = renderWidget
      return
    }

    // Load the script
    if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
      script.async = true
      script.defer = true

      window.onTurnstileLoad = renderWidget

      document.head.appendChild(script)
    }

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (e) {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null
      }
    }
  }, [siteKey, renderWidget])

  // Don't render anything if site key is not configured
  if (!siteKey) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`cf-turnstile ${className}`}
      data-sitekey={siteKey}
    />
  )
}
