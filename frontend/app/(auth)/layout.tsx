'use client'

import { useEffect } from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Force light mode for auth pages by temporarily overriding the theme
  useEffect(() => {
    const root = document.documentElement
    const originalClasses = root.className

    // Remove dark class and ensure light mode
    root.classList.remove('dark')
    root.classList.add('light')

    // Restore original classes when leaving auth pages
    return () => {
      root.className = originalClasses
    }
  }, [])

  return (
    <div className="light" data-theme="light">
      {children}
    </div>
  )
}
