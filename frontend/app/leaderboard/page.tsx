'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, Flame, Award, Info, X, Sparkles, Users, ChevronDown, ChevronUp, Target, Search, Calendar } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

const BADGE_INFO = [
  // Milestone badges
  { icon: '🎯', name: 'First Post', description: 'Shared your first opportunity' },
  { icon: '⭐', name: 'Rising Star', description: 'Posted 5+ opportunities' },
  { icon: '🌟', name: 'Veteran', description: 'Posted 10+ opportunities' },
  { icon: '🏆', name: 'Legend', description: 'Posted 25+ opportunities' },
  { icon: '👑', name: 'Champion', description: 'Posted 50+ opportunities' },
  // Activity badges
  { icon: '🔥', name: 'Hot Streak', description: 'Posted 2+ times this week' },
  { icon: '📈', name: 'Consistent', description: 'Active for 3+ weeks' },
  { icon: '🗓️', name: 'Weekend Warrior', description: 'Posted on a weekend' },
  // Special badges
  { icon: '🚀', name: 'Pioneer', description: 'Among the first 10 contributors' },
  { icon: '🌈', name: 'Explorer', description: 'Posted 3+ different types' },
  { icon: '💎', name: 'Top Contributor', description: 'Currently in top 3' },
  { icon: '💼', name: 'Helper', description: 'Shared 3+ job opportunities' },
  // Time-based badges
  { icon: '🌅', name: 'Early Bird', description: 'Posted before 9 AM' },
  { icon: '🦉', name: 'Night Owl', description: 'Posted after 10 PM' },
]

interface Badge {
  id: string
  name: string
  description: string
  icon: string
}

interface Contributor {
  id: string
  name: string
  avatar_url: string | null
  post_count: number
  recent_posts: number
  first_post_date: string | null
  opportunity_types: string[]
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | null
  badges: Badge[]
  rank: number | null
}

const tierConfig = {
  bronze: {
    label: 'Bronze',
    description: '1-4 posts',
    gradient: 'from-orange-400 to-amber-600',
    bgGradient: 'bg-card',
    borderColor: 'border-l-orange-400',
    textColor: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/30',
    rankBg: 'bg-gradient-to-br from-orange-400 to-amber-600',
  },
  silver: {
    label: 'Silver',
    description: '5-9 posts',
    gradient: 'from-slate-300 to-slate-500',
    bgGradient: 'bg-card',
    borderColor: 'border-l-slate-400',
    textColor: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/50',
    rankBg: 'bg-gradient-to-br from-slate-300 to-slate-500',
  },
  gold: {
    label: 'Gold',
    description: '10-24 posts',
    gradient: 'from-yellow-400 to-amber-500',
    bgGradient: 'bg-card',
    borderColor: 'border-l-yellow-400',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    rankBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
  },
  platinum: {
    label: 'Platinum',
    description: '25+ posts',
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
    bgGradient: 'bg-card',
    borderColor: 'border-l-cyan-400',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    rankBg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
  }
}

// Config for users with no posts (no tier)
const noTierConfig = {
  gradient: 'from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600',
  bgGradient: 'bg-card',
  borderColor: 'border-l-transparent',
  textColor: 'text-muted-foreground',
  rankBg: 'bg-muted',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}


export default function LeaderboardPage() {
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBadgeInfo, setShowBadgeInfo] = useState(false)
  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<'all' | 'week'>('all')
  const [showTierInfo, setShowTierInfo] = useState(false)

  // Check for newly earned badges - only show popup once per badge
  const checkForNewBadges = useCallback((userId: string, userBadges: Badge[]) => {
    const storageKey = `earned_badges_${userId}`
    const shownKey = `shown_badges_${userId}`

    const storedBadges = localStorage.getItem(storageKey)
    const shownBadges = localStorage.getItem(shownKey)

    const previousBadgeIds: string[] = storedBadges ? JSON.parse(storedBadges) : []
    const alreadyShownIds: string[] = shownBadges ? JSON.parse(shownBadges) : []
    const currentBadgeIds = userBadges.map(b => b.id)

    // Find badges that are new AND haven't been shown yet
    const newBadges = userBadges.filter(b =>
      !previousBadgeIds.includes(b.id) && !alreadyShownIds.includes(b.id)
    )

    // Update stored badges
    localStorage.setItem(storageKey, JSON.stringify(currentBadgeIds))

    // Show notification for first new badge found and mark it as shown
    if (newBadges.length > 0) {
      const badgeToShow = newBadges[0]
      setEarnedBadge(badgeToShow)
      // Mark this badge as shown so it won't appear again
      localStorage.setItem(shownKey, JSON.stringify([...alreadyShownIds, badgeToShow.id]))
    }
  }, [])

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        // Get current user
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }

        const response = await fetch('/api/contributors')
        if (response.ok) {
          const data = await response.json()
          setContributors(data.contributors || [])

          // Check for new badges if user is logged in
          if (user) {
            const currentUserData = (data.contributors || []).find((c: Contributor) => c.id === user.id)
            if (currentUserData && currentUserData.badges.length > 0) {
              checkForNewBadges(user.id, currentUserData.badges)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch contributors:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContributors()
  }, [checkForNewBadges])

  // Calculate stats
  const totalPosts = contributors.reduce((sum, c) => sum + c.post_count, 0)
  const totalRecentPosts = contributors.reduce((sum, c) => sum + c.recent_posts, 0)
  const activeContributors = contributors.filter(c => c.post_count > 0).length

  // Filter contributors based on search and time filter
  const filteredContributors = contributors.filter(contributor => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      contributor.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Time filter - when "week" is selected, only show users with recent posts
    const matchesTime = timeFilter === 'all' || contributor.recent_posts > 0

    return matchesSearch && matchesTime
  })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-r from-purple-800 via-purple-700 to-blue-800 dark:from-purple-900/30 dark:via-purple-800/30 dark:to-blue-900/30 text-white dark:text-foreground overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 via-green-500 to-yellow-500 z-20"></div>

        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-4xl mx-auto text-center space-y-4"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Community Leaderboard
            </h1>
            <p className="text-base sm:text-lg text-purple-200 dark:text-muted-foreground max-w-2xl mx-auto">
              Celebrating our amazing contributors who help others discover opportunities
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-6 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{activeContributors}</div>
                <div className="text-sm text-muted-foreground">Contributors</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{totalPosts}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{totalRecentPosts}</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Info Modal */}
      <AnimatePresence>
        {showTierInfo && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTierInfo(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4"
            >
              <div className="bg-card rounded-xl shadow-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-foreground">Tier System</h3>
                  </div>
                  <button
                    onClick={() => setShowTierInfo(false)}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                {/* Tier List */}
                <div className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Tiers are based on your rank among all contributors
                  </p>
                  {(['platinum', 'gold', 'silver', 'bronze'] as const).map((tier) => {
                    const config = tierConfig[tier]
                    return (
                      <div
                        key={tier}
                        className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${config.borderColor} bg-muted/30`}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold ${config.textColor}`}>{config.label}</div>
                          <div className="text-sm text-muted-foreground">{config.description}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Badge Info Modal */}
      <AnimatePresence>
        {showBadgeInfo && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBadgeInfo(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
            >
              <div className="bg-card rounded-xl shadow-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-foreground">Available Badges</h3>
                  </div>
                  <button
                    onClick={() => setShowBadgeInfo(false)}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                {/* Badge List */}
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {BADGE_INFO.map((badge) => (
                    <div
                      key={badge.name}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <div className="font-medium text-foreground">{badge.name}</div>
                        <div className="text-sm text-muted-foreground">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Badge Earned Notification Modal */}
      <AnimatePresence>
        {earnedBadge && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEarnedBadge(null)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            {/* Celebration Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4"
            >
              <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Confetti/celebration header */}
                <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 px-6 py-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4"
                  >
                    <span className="text-5xl">{earnedBadge.icon}</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-center gap-1 text-white/80 text-sm mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>New Badge Earned!</span>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{earnedBadge.name}</h3>
                  </motion.div>
                </div>
                {/* Content */}
                <div className="px-6 py-5 text-center">
                  <p className="text-muted-foreground mb-5">{earnedBadge.description}</p>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => setEarnedBadge(null)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                  >
                    Awesome! 🎉
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tier Legend & Badges Buttons */}
      <section className="py-5 bg-background border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
            <button
              onClick={() => setShowTierInfo(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>View Tiers</span>
              <Info className="w-3 h-3" />
            </button>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={() => setShowBadgeInfo(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>View Badges</span>
              <Info className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Contributors List */}
      <section className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              {/* Time Filter */}
              <div className="flex rounded-lg border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setTimeFilter('all')}
                  className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    timeFilter === 'all'
                      ? 'bg-purple-500 text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  All Time
                </button>
                <button
                  onClick={() => setTimeFilter('week')}
                  className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    timeFilter === 'week'
                      ? 'bg-purple-500 text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  This Week
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-6 border border-border animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-5 w-40 bg-muted rounded mb-2" />
                      <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                    <div className="hidden sm:flex gap-8">
                      <div className="h-8 w-16 bg-muted rounded" />
                      <div className="h-8 w-16 bg-muted rounded" />
                      <div className="h-8 w-16 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContributors.length === 0 ? (
            <div className="text-center py-16 max-w-4xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                {searchQuery || timeFilter === 'week' ? (
                  <Search className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <Users className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery ? 'No members found' : timeFilter === 'week' ? 'No activity this week' : 'No members yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No members match "${searchQuery}"`
                  : timeFilter === 'week'
                  ? 'No one has posted opportunities this week yet'
                  : 'Be the first to join and start posting opportunities!'}
              </p>
              {(searchQuery || timeFilter === 'week') && (
                <button
                  onClick={() => { setSearchQuery(''); setTimeFilter('all'); }}
                  className="mt-4 text-purple-600 dark:text-purple-400 hover:underline text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Your Rank - shown if logged in and not in top 3 */}
              {currentUserId && (() => {
                const currentUser = contributors.find(c => c.id === currentUserId)
                if (currentUser && currentUser.rank && currentUser.rank > 3) {
                  const config = tierConfig[currentUser.tier!]
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-purple-500" />
                        <span className="text-sm font-medium text-foreground">Your Rank</span>
                        <div className="flex-1" />
                        <div className={`w-8 h-8 rounded-full ${config.rankBg} flex items-center justify-center text-white text-xs font-bold`}>
                          #{currentUser.rank}
                        </div>
                        <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
                        <span className="text-sm text-muted-foreground">{currentUser.post_count} posts</span>
                      </div>
                    </motion.div>
                  )
                }
                return null
              })()}

              {/* Full leaderboard list */}
              <div className="space-y-2">
                {filteredContributors.map((contributor, index) => {
                  const hasTier = contributor.tier !== null
                  const config = hasTier ? tierConfig[contributor.tier!] : null
                  const isExpanded = expandedCard === contributor.id
                  const isCurrentUser = contributor.id === currentUserId

                  return (
                    <motion.div
                      key={contributor.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className={`${config?.bgGradient || noTierConfig.bgGradient} rounded-lg border ${isCurrentUser ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'border-border'} ${hasTier ? `border-l-4 ${config!.borderColor}` : ''} hover:shadow-sm transition-all cursor-pointer`}
                      onClick={() => setExpandedCard(isExpanded ? null : contributor.id)}
                    >
                      <div className="px-4 py-3 flex items-center gap-3">
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full ${hasTier ? config!.rankBg : noTierConfig.rankBg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {hasTier ? `#${contributor.rank}` : '—'}
                        </div>

                        {/* Avatar */}
                        {contributor.avatar_url ? (
                          <Image
                            src={contributor.avatar_url}
                            alt={contributor.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${hasTier ? config!.gradient : noTierConfig.gradient} flex items-center justify-center text-white font-medium text-sm`}>
                            {getInitials(contributor.name)}
                          </div>
                        )}

                        {/* Name & Tier */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">{contributor.name}</span>
                            {contributor.rank === 1 && <span className="text-sm" title="1st Place">🥇</span>}
                            {contributor.rank === 2 && <span className="text-sm" title="2nd Place">🥈</span>}
                            {contributor.rank === 3 && <span className="text-sm" title="3rd Place">🥉</span>}
                            {isCurrentUser && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400">You</span>}
                            {contributor.recent_posts > 0 && <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                          </div>
                          <span className={`text-xs ${hasTier ? config!.textColor : 'text-muted-foreground'}`}>
                            {hasTier ? config!.label : 'No posts yet'}
                          </span>
                        </div>

                        {/* Badge count indicator */}
                        {contributor.badges.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                            <Award className="w-3.5 h-3.5" />
                            <span className="text-xs">{contributor.badges.length}</span>
                          </div>
                        )}

                        {/* Post count */}
                        {hasTier && (
                          <div className="text-right">
                            <span className="text-lg font-bold text-foreground">{contributor.post_count}</span>
                            <span className="text-xs text-muted-foreground ml-1">posts</span>
                          </div>
                        )}

                        {/* Expand indicator */}
                        {(contributor.badges.length > 0 || contributor.opportunity_types.length > 0) && (
                          <div className="text-muted-foreground">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        )}
                      </div>

                      {/* Expanded details section */}
                      <AnimatePresence>
                        {isExpanded && (contributor.badges.length > 0 || contributor.opportunity_types.length > 0) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 pt-1 border-t border-border/50 space-y-3">
                              {/* Badges */}
                              {contributor.badges.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">Badges earned:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {contributor.badges.map((badge) => (
                                      <div
                                        key={badge.id}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs"
                                      >
                                        <span>{badge.icon}</span>
                                        <span className="text-foreground">{badge.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Opportunity types shared */}
                              {contributor.opportunity_types.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">Types shared:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {contributor.opportunity_types.map((type) => (
                                      <span
                                        key={type}
                                        className="px-2 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                      >
                                        {type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
