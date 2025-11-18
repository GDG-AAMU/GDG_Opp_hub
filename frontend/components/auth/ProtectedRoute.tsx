'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  readonly children: React.ReactNode
}

function ProtectedRouteContent({ children }: Readonly<ProtectedRouteProps>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      // Preserve the current URL (path + query params) for redirect after login
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
    }
  }, [user, loading, router, pathname, searchParams])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

export default function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    }>
      <ProtectedRouteContent>{children}</ProtectedRouteContent>
    </Suspense>
  )
}