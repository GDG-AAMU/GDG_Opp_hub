'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SignupForm from '@/components/auth/SignupForm'
import { useAuth } from '@/hooks/useAuth'

export default function SignupPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 py-12">
      <SignupForm />
    </div>
  )
}