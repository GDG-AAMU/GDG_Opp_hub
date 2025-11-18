'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Briefcase, Calendar, GraduationCap, Mail, Settings, User as UserIcon, Camera, Upload, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'

type UserProfile = Database['public']['Tables']['users']['Row']

export default function ProfilePage() {
  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const [opportunitiesCount, setOpportunitiesCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const abortController = new AbortController()
    let isMounted = true

    async function fetchProfileData() {
      if (!user?.id) return

      try {
        setLoading(true)

        // Fetch user profile from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userError) throw userError

        // Fetch count of opportunities submitted by this user
        const { count, error: countError } = await supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('submitted_by', user.id)

        if (countError && process.env.NODE_ENV === 'development') {
          console.error('Error fetching opportunities count:', countError)
        }

        if (!isMounted) return

        setProfileData(userData)
        setOpportunitiesCount(count || 0)
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return

        if (!isMounted) return

        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching profile data:', err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfileData()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [user?.id, user?.email, supabase])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy')
    } catch {
      return 'N/A'
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setUploading(true)

      // Create unique file name with user ID and timestamp
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${user.id}/avatar-${timestamp}.${fileExt}`

      // Delete old avatar if exists
      if (profileData?.avatar_url) {
        // Extract storage path from public URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/avatars/path
        const urlParts = profileData.avatar_url.split('/public/avatars/')
        if (urlParts.length > 1) {
          const storagePath = urlParts[1].split('?')[0] // Remove query params
          await supabase.storage
            .from('avatars')
            .remove([storagePath])
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false // Use false to prevent overwriting; we use unique names
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL with cache buster
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const publicUrl = `${data.publicUrl}?t=${timestamp}`

      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      toast.success('Profile picture updated successfully!')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error uploading avatar:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to upload profile picture')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!user || !profileData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Could not load profile data. Please try again later.</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="relative">
          {/* Cover Background */}
          <div className="h-48 sm:h-56 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTI2IDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDEwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
            
            {/* Back Button */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex gap-2">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                size="sm"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>

            {/* Edit Profile Button */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <Button
                onClick={() => router.push('/settings')}
                variant="outline"
                size="sm"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Profile Info Container */}
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative -mt-16 sm:-mt-20">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                      alt={profileData?.name || 'User'}
                      className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white shadow-xl"
                    />
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {/* Hover overlay */}
                    {!uploading && (
                      <div className="absolute inset-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-200">
                        <Camera className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    )}
                    
                    {/* Uploading state */}
                    {uploading && (
                      <div className="absolute inset-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-black bg-opacity-50 flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 text-white animate-bounce mb-2" />
                        <p className="text-white text-xs font-medium">Uploading...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name and Badges */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    {profileData?.name || 'User'}
                  </h1>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="inline-flex items-center px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {profileData?.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                    </span>
                    {profileData?.major && (
                      <span className="inline-flex items-center px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        📚 {profileData.major}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* About Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-purple-600" />
                  About
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 font-medium mb-1">Email Address</p>
                      <p className="text-base text-gray-900 font-medium break-all">{profileData?.email || user?.email || 'N/A'}</p>
                    </div>
                  </div>

                  {profileData?.major && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 font-medium mb-1">Major</p>
                        <p className="text-base text-gray-900 font-medium">{profileData.major}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">Member Since</p>
                      <p className="text-base text-gray-900 font-medium">{formatDate(profileData?.created_at || null)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                  Statistics
                </h2>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mb-4">
                    <Briefcase className="w-10 h-10 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-gray-900 mb-2">{opportunitiesCount}</p>
                    <p className="text-sm text-gray-600 font-medium">
                      {opportunitiesCount === 1 ? 'Opportunity' : 'Opportunities'} Submitted
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contribution Card */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-md p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">🎉</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Your Contribution</h3>
                  <p className="text-purple-100 leading-relaxed">
                    Thank you for being part of the GDG Opportunities Hub community!
                    {opportunitiesCount > 0
                      ? ` You have shared ${opportunitiesCount} ${opportunitiesCount === 1 ? 'opportunity' : 'opportunities'} with fellow students. Keep up the great work!`
                      : ' Share your first opportunity today and help your fellow students discover amazing opportunities!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  )
}
