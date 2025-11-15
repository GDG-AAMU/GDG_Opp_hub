'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully!')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
              <p className="text-gray-600 mb-6">
                Dashboard page - Coming Soon
              </p>

              <Button onClick={handleLogout} variant="outline">
                Log out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}