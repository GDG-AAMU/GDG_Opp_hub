'use client'

import { Toaster } from 'react-hot-toast'
import { useTheme } from '@/components/theme/ThemeProvider'

export function ThemedToaster() {
  const { theme, resolvedTheme } = useTheme()

  // Determine the current theme (handles 'system' theme)
  const currentTheme = theme === 'system' ? resolvedTheme : theme

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: currentTheme === 'dark' ? '#1f2937' : '#ffffff',
          color: currentTheme === 'dark' ? '#f3f4f6' : '#111827',
          border: currentTheme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
        },
        // Success toast styling
        success: {
          iconTheme: {
            primary: currentTheme === 'dark' ? '#10b981' : '#22c55e',
            secondary: currentTheme === 'dark' ? '#1f2937' : '#ffffff',
          },
        },
        // Error toast styling
        error: {
          iconTheme: {
            primary: currentTheme === 'dark' ? '#ef4444' : '#dc2626',
            secondary: currentTheme === 'dark' ? '#1f2937' : '#ffffff',
          },
        },
      }}
    />
  )
}
