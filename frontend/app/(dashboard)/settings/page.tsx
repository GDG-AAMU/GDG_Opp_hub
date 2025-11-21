'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { User as UserIcon, MapPin, Shield, Lock, Calendar, Mail, GraduationCap, Globe, MapPinned, ArrowLeft, Bell, Briefcase, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/components/theme/ThemeProvider'
import toast from 'react-hot-toast'

type UserRow = Database["public"]["Tables"]["users"]["Row"]

// Prevent static generation - this page requires authentication
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { profile: profileData, loading, invalidateCache } = useUserProfile()
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'basic' | 'location' | 'notifications' | 'appearance' | 'account'>('basic')

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [major, setMajor] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [birthday, setBirthday] = useState('')
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [state, setState] = useState('')

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false)

  // Notification preferences state
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(true)
  const [deadlineRemindersEnabled, setDeadlineRemindersEnabled] = useState(true)
  const [dailyDigestTime, setDailyDigestTime] = useState('18:00')
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [notificationChanges, setNotificationChanges] = useState(false)

  // Initialize form fields when profile data loads
  useEffect(() => {
    if (!profileData) return

    setName(profileData.name || '')
    setEmail(profileData.email || '')
    setMajor(profileData.major || '')
    setGender((profileData.gender || '') as 'male' | 'female' | 'other' | '')
    setBirthday(profileData.birthday || '')
    setCountry(profileData.country || '')
    setRegion(profileData.region || '')
    setState(profileData.state || '')
    
    // Load notification preferences
    setEmailNotificationsEnabled(profileData.email_notifications_enabled ?? true)
    setDailyDigestEnabled(profileData.daily_digest_enabled ?? true)
    setDeadlineRemindersEnabled(profileData.deadline_reminders_enabled ?? true)
    if (profileData.daily_digest_time) {
      const time = profileData.daily_digest_time.substring(0, 5) // Extract HH:MM from HH:MM:SS
      setDailyDigestTime(time)
    }
  }, [profileData])

  // Track changes
  useEffect(() => {
    if (!profileData) return
    
    const changed = 
      name !== (profileData.name || '') ||
      major !== (profileData.major || '') ||
      gender !== (profileData.gender || '') ||
      birthday !== (profileData.birthday || '') ||
      country !== (profileData.country || '') ||
      region !== (profileData.region || '') ||
      state !== (profileData.state || '')
    
    setHasChanges(changed)
  }, [name, major, gender, birthday, country, region, state, profileData])

  const handleSaveAll = async () => {
    if (!user?.id) return

    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    try {
      setSaving(true)
      const supabase = createClient()

      const updates: any = {
        name,
        major: major || null,
        gender: gender || null,
        birthday: birthday || null,
        country: country || null,
        region: region || null,
        state: state || null,
      }

      const { error } = await (supabase
        .from('users') as any)
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Invalidate cache to refetch updated profile
      invalidateCache()
      setHasChanges(false)
      toast.success('Settings saved successfully!')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating profile:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success('Password reset email sent! Check your inbox.')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending password reset:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to send password reset email')
    }
  }

  // Track notification preference changes
  useEffect(() => {
    if (!profileData) return
    
    const changed = 
      emailNotificationsEnabled !== (profileData.email_notifications_enabled ?? true) ||
      dailyDigestEnabled !== (profileData.daily_digest_enabled ?? true) ||
      deadlineRemindersEnabled !== (profileData.deadline_reminders_enabled ?? true) ||
      dailyDigestTime !== (profileData.daily_digest_time ? profileData.daily_digest_time.substring(0, 5) : '18:00')
    
    setNotificationChanges(changed)
  }, [emailNotificationsEnabled, dailyDigestEnabled, deadlineRemindersEnabled, dailyDigestTime, profileData])

  const handleSaveNotificationPreferences = async () => {
    if (!user?.id) return

    try {
      setNotificationSaving(true)
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_notifications_enabled: emailNotificationsEnabled,
          daily_digest_enabled: dailyDigestEnabled,
          deadline_reminders_enabled: deadlineRemindersEnabled,
          daily_digest_time: dailyDigestTime,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save preferences')
      }

      // Invalidate cache to refetch updated profile
      invalidateCache()

      setNotificationChanges(false)
      toast.success('Notification preferences saved!')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving notification preferences:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setNotificationSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-2">
                <Button
                  onClick={() => router.back()}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground -ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:w-64 flex-shrink-0">
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden sticky top-6">
                  <nav className="flex flex-col p-2">
                    <button
                      onClick={() => setActiveSection('basic')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        activeSection === 'basic'
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <UserIcon className="w-5 h-5" />
                      <span>Personal Info</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('location')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        activeSection === 'location'
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                      <span>Location</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('notifications')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        activeSection === 'notifications'
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('appearance')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        activeSection === 'appearance'
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <Monitor className="w-5 h-5" />
                      <span>Appearance</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('account')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        activeSection === 'account'
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                      <span>Account</span>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 pb-24">
                {/* Personal Information Section */}
                {activeSection === 'basic' && (
                  <div className="bg-card rounded-xl shadow-sm border border-border p-6 lg:p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Personal Information</h2>
                      <p className="text-muted-foreground">Update your personal details and profile information</p>
                    </div>

                    <div className="space-y-6">
                      {/* Name Field */}
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                          Full Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      {/* Major Field */}
                      <div>
                        <label htmlFor="major" className="block text-sm font-semibold text-foreground mb-2">
                          Major / Field of Study
                        </label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            id="major"
                            type="text"
                            value={major}
                            onChange={(e) => setMajor(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                            placeholder="e.g., Computer Science"
                          />
                        </div>
                      </div>

                      {/* Gender Field */}
                      <div>
                        <label htmlFor="gender" className="block text-sm font-semibold text-foreground mb-2">
                          Gender
                        </label>
                        <select
                          id="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
                          className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Birthday Field */}
                      <div>
                        <label htmlFor="birthday" className="block text-sm font-semibold text-foreground mb-2">
                          Birthday
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            id="birthday"
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Information Section */}
                {activeSection === 'location' && (
                  <div className="bg-card rounded-xl shadow-sm border border-border p-6 lg:p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Location Information</h2>
                      <p className="text-muted-foreground">{"Let us know where you're based"}</p>
                    </div>

                    <div className="space-y-6">
                      {/* Country Field */}
                      <div>
                        <label htmlFor="country" className="block text-sm font-semibold text-foreground mb-2">
                          Country
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <select
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all appearance-none"
                          >
                            <option value="">Select country</option>
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="India">India</option>
                            <option value="China">China</option>
                            <option value="Japan">Japan</option>
                            <option value="Nigeria">Nigeria</option>
                            <option value="South Africa">South Africa</option>
                            <option value="Brazil">Brazil</option>
                            <option value="Mexico">Mexico</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Region/Province Field */}
                      <div>
                        <label htmlFor="region" className="block text-sm font-semibold text-foreground mb-2">
                          Region / Province
                        </label>
                        <div className="relative">
                          <MapPinned className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            id="region"
                            type="text"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                            placeholder="e.g., Ontario, California"
                          />
                        </div>
                      </div>

                      {/* State/City Field */}
                      <div>
                        <label htmlFor="state" className="block text-sm font-semibold text-foreground mb-2">
                          State / City
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            id="state"
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                            placeholder="e.g., Toronto, Los Angeles"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Section */}
                {activeSection === 'notifications' && (
                  <div className="bg-card rounded-xl shadow-sm border border-border p-6 lg:p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Email Notifications</h2>
                      <p className="text-muted-foreground">Manage your email notification preferences</p>
                    </div>

                    <div className="space-y-6">
                      {/* Email Notifications Toggle */}
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground mb-1">
                            Email Notifications
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications about new opportunities and deadlines
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailNotificationsEnabled}
                            onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500"></div>
                        </label>
                      </div>

                      {/* Daily Digest Toggle */}
                      <div className={`flex items-center justify-between p-4 border border-border rounded-lg ${!emailNotificationsEnabled ? 'opacity-50' : ''}`}>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground mb-1">
                            Daily Digest
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Receive a daily summary of new opportunities matching your major
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dailyDigestEnabled}
                            onChange={(e) => setDailyDigestEnabled(e.target.checked)}
                            disabled={!emailNotificationsEnabled}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500 peer-disabled:opacity-50"></div>
                        </label>
                      </div>

                      {/* Daily Digest Time */}
                      {dailyDigestEnabled && emailNotificationsEnabled && (
                        <div className="p-4 border border-border rounded-lg bg-muted/30">
                          <label htmlFor="digest-time" className="block text-sm font-semibold text-foreground mb-2">
                            Daily Digest Time
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                              id="digest-time"
                              type="time"
                              value={dailyDigestTime}
                              onChange={(e) => setDailyDigestTime(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                            />
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            We&apos;ll send your daily digest at this time (in your local timezone)
                          </p>
                        </div>
                      )}

                      {/* Deadline Reminders Toggle */}
                      <div className={`flex items-center justify-between p-4 border border-border rounded-lg ${!emailNotificationsEnabled ? 'opacity-50' : ''}`}>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground mb-1">
                            Deadline Reminders
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Get notified when opportunities you&apos;re interested in are approaching their deadline
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deadlineRemindersEnabled}
                            onChange={(e) => setDeadlineRemindersEnabled(e.target.checked)}
                            disabled={!emailNotificationsEnabled}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500 peer-disabled:opacity-50"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Section */}
                {activeSection === 'appearance' && (
                  <div className="bg-card rounded-xl shadow-sm border border-border p-6 lg:p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Appearance</h2>
                      <p className="text-muted-foreground">Customize how the app looks</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-4">
                          Theme
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <button
                            onClick={() => setTheme('light')}
                            className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                              theme === 'light'
                                ? 'border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30'
                                : 'border-border hover:border-purple-400 dark:hover:border-purple-500 hover:bg-accent'
                            }`}
                          >
                            <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
                            <span className={`font-medium ${theme === 'light' ? 'text-purple-700 dark:text-purple-300' : 'text-foreground'}`}>
                              Light
                            </span>
                          </button>

                          <button
                            onClick={() => setTheme('dark')}
                            className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                              theme === 'dark'
                                ? 'border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30'
                                : 'border-border hover:border-purple-400 dark:hover:border-purple-500 hover:bg-accent'
                            }`}
                          >
                            <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
                            <span className={`font-medium ${theme === 'dark' ? 'text-purple-700 dark:text-purple-300' : 'text-foreground'}`}>
                              Dark
                            </span>
                          </button>

                          <button
                            onClick={() => setTheme('system')}
                            className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                              theme === 'system'
                                ? 'border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30'
                                : 'border-border hover:border-purple-400 dark:hover:border-purple-500 hover:bg-accent'
                            }`}
                          >
                            <Monitor className={`w-6 h-6 ${theme === 'system' ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
                            <span className={`font-medium ${theme === 'system' ? 'text-purple-700 dark:text-purple-300' : 'text-foreground'}`}>
                              System
                            </span>
                          </button>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                          {theme === 'system'
                            ? `Following your system preference (currently ${resolvedTheme})`
                            : `Using ${theme} theme`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Settings Section */}
                {activeSection === 'account' && (
                  <div className="bg-card rounded-xl shadow-sm border border-border p-6 lg:p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Account Settings</h2>
                      <p className="text-muted-foreground">Manage your account security and preferences</p>
                    </div>

                    <div className="space-y-8">
                      {/* Email Field (Read-only) */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            id="email"
                            type="email"
                            value={email}
                            disabled
                            className="w-full pl-11 pr-4 py-3 border border-border rounded-lg bg-muted/50 text-muted-foreground cursor-not-allowed"
                          />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {"Your email can't be changed at this time"}
                        </p>
                      </div>

                      {/* Role Display */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-3">
                          Account Role
                        </label>
                        <div className="inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-semibold">
                          <Shield className="w-4 h-4 mr-2" />
                          {profileData?.role === 'admin' ? 'Admin' : 'Student'}
                        </div>
                      </div>

                      {/* Account Created */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Member Since
                        </label>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <span>
                            {profileData?.created_at
                              ? new Date(profileData.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-border"></div>

                      {/* Password Section */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Password
                        </label>
                        <p className="text-muted-foreground mb-4">
                          Manage your password and account security
                        </p>
                        <Button
                          onClick={handlePasswordReset}
                          variant="outline"
                          className="text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Save Button */}
        {(activeSection === 'basic' || activeSection === 'location') && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <span className="text-sm text-muted-foreground">
                      You have unsaved changes
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving || !hasChanges || !name.trim()}
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-8 py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Save Button for Notifications */}
        {activeSection === 'notifications' && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {notificationChanges && (
                    <span className="text-sm text-muted-foreground">
                      You have unsaved changes
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSaveNotificationPreferences}
                  disabled={notificationSaving || !notificationChanges}
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-8 py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {notificationSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
