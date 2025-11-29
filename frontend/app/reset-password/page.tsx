'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Force light mode for reset password page
  useEffect(() => {
    const root = document.documentElement
    const originalClasses = root.className

    root.classList.remove('dark')
    root.classList.add('light')

    return () => {
      root.className = originalClasses
    }
  }, [])

  // Verify the session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const supabase = createClient()

        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          toast.error('Invalid or expired reset link. Please request a new one.')
          setTimeout(() => {
            router.push('/forgot-password')
          }, 2000)
          return
        }

        setSessionValid(true)
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error verifying session:', err)
        }
        toast.error('Failed to verify reset link')
        setTimeout(() => {
          router.push('/forgot-password')
        }, 2000)
      } finally {
        setVerifying(false)
      }
    }

    verifySession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success('Password updated successfully! Please log in with your new password.')

      // Sign out the user to clear the password reset session
      // This invalidates the reset link so it can't be reused
      await supabase.auth.signOut()

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error resetting password:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while verifying session
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Don't render form if session is invalid
  if (!sessionValid) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
                placeholder="Enter new password"
                disabled={loading}
                autoComplete="new-password"
                style={{
                  WebkitTextSecurity: showPassword ? 'none' : undefined,
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
                placeholder="Confirm new password"
                disabled={loading}
                autoComplete="new-password"
                style={{
                  WebkitTextSecurity: showConfirmPassword ? 'none' : undefined,
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
