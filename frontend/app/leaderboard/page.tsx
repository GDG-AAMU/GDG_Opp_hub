'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Trophy, Users, TrendingUp, Calendar, Flame, Award } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

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
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  badges: Badge[]
  rank: number
}

const tierConfig = {
  bronze: {
    label: 'Bronze',
    description: '1-4 posts',
    gradient: 'from-amber-600 to-amber-800',
    bgGradient: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    borderColor: 'border-l-amber-500',
    textColor: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    rankBg: 'bg-amber-500',
    accentColor: 'amber'
  },
  silver: {
    label: 'Silver',
    description: '5-9 posts',
    gradient: 'from-slate-400 to-slate-600',
    bgGradient: 'bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30',
    borderColor: 'border-l-slate-400',
    textColor: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800/50',
    rankBg: 'bg-slate-500',
    accentColor: 'slate'
  },
  gold: {
    label: 'Gold',
    description: '10-19 posts',
    gradient: 'from-yellow-400 to-yellow-600',
    bgGradient: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
    borderColor: 'border-l-yellow-500',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    rankBg: 'bg-yellow-500',
    accentColor: 'yellow'
  },
  platinum: {
    label: 'Platinum',
    description: '20+ posts',
    gradient: 'from-purple-500 to-indigo-600',
    bgGradient: 'bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40',
    borderColor: 'border-l-purple-500',
    textColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
    rankBg: 'bg-gradient-to-r from-purple-500 to-indigo-600',
    accentColor: 'purple'
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatTypeLabel(type: string): string {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export default function LeaderboardPage() {
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const response = await fetch('/api/contributors')
        if (response.ok) {
          const data = await response.json()
          setContributors(data.contributors || [])
        }
      } catch (error) {
        console.error('Failed to fetch contributors:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContributors()
  }, [])

  // Calculate stats
  const totalPosts = contributors.reduce((sum, c) => sum + c.post_count, 0)
  const totalRecentPosts = contributors.reduce((sum, c) => sum + c.recent_posts, 0)

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
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{contributors.length}</div>
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

      {/* Tier Legend */}
      <section className="py-6 bg-background border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {(['platinum', 'gold', 'silver', 'bronze'] as const).map((tier) => {
              const config = tierConfig[tier]
              return (
                <div key={tier} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${config.gradient}`} />
                  <span className={`text-sm font-semibold ${config.textColor}`}>{config.label}</span>
                  <span className="text-xs text-muted-foreground">({config.description})</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contributors List */}
      <section className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
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
          ) : contributors.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No contributors yet</h3>
              <p className="text-muted-foreground">Be the first to post an opportunity and appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-5xl mx-auto">
              {contributors.map((contributor, index) => {
                const config = tierConfig[contributor.tier]
                const isTopThree = index < 3

                return (
                  <motion.div
                    key={contributor.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: 'easeOut'
                    }}
                    className={`${config.bgGradient} rounded-xl border-l-4 ${config.borderColor} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Rank & Avatar */}
                        <div className="flex items-center gap-4">
                          {/* Rank Badge */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.rankBg} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                            {isTopThree ? (
                              <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                            ) : (
                              <span className="text-sm">#{contributor.rank}</span>
                            )}
                          </div>

                          {/* Avatar */}
                          {contributor.avatar_url ? (
                            <Image
                              src={contributor.avatar_url}
                              alt={contributor.name}
                              width={64}
                              height={64}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md"
                            />
                          ) : (
                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-bold text-xl border-2 border-white dark:border-gray-700 shadow-md`}>
                              {getInitials(contributor.name)}
                            </div>
                          )}

                          {/* Name & Tier */}
                          <div>
                            <h3 className="font-bold text-lg text-foreground">{contributor.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 ${config.badgeBg} ${config.textColor} text-xs font-semibold rounded-full`}>
                                {config.label}
                              </span>
                              {contributor.recent_posts > 0 && (
                                <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                  <Flame className="w-3 h-3" />
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex-1 grid grid-cols-3 gap-4 sm:gap-8 sm:ml-auto sm:max-w-md">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">{contributor.post_count}</div>
                            <div className="text-xs text-muted-foreground">Total Posts</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">{contributor.recent_posts}</div>
                            <div className="text-xs text-muted-foreground">This Week</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-foreground flex items-center justify-center gap-1">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {formatDate(contributor.first_post_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">First Post</div>
                          </div>
                        </div>
                      </div>

                      {/* Badges & Types Row */}
                      <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Badges */}
                        {contributor.badges.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Award className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            {contributor.badges.map((badge) => (
                              <span
                                key={badge.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-background/80 rounded-full text-xs border border-border"
                                title={badge.description}
                              >
                                <span>{badge.icon}</span>
                                <span className="text-foreground font-medium">{badge.name}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Opportunity Types */}
                        {contributor.opportunity_types.length > 0 && (
                          <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Posts in:</span>
                            {contributor.opportunity_types.slice(0, 4).map((type) => (
                              <span
                                key={type}
                                className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                              >
                                {formatTypeLabel(type)}
                              </span>
                            ))}
                            {contributor.opportunity_types.length > 4 && (
                              <span className="text-xs text-muted-foreground">+{contributor.opportunity_types.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Badge Legend */}
      <section className="py-8 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <h3 className="text-lg font-semibold text-foreground text-center mb-6">Available Badges</h3>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {[
              { icon: '🎯', name: 'First Steps', description: 'Post your first opportunity' },
              { icon: '⭐', name: 'Rising Star', description: 'Post 5 opportunities' },
              { icon: '🌟', name: 'Dedicated', description: 'Post 10 opportunities' },
              { icon: '🏆', name: 'Champion', description: 'Post 20 opportunities' },
              { icon: '🚀', name: 'Early Adopter', description: 'Among first 10 contributors' },
              { icon: '🔥', name: 'On Fire', description: '3+ posts this week' },
              { icon: '🌈', name: 'Diverse', description: 'Post 3+ different types' },
              { icon: '👑', name: 'Top Contributor', description: 'Reach top 3' },
            ].map((badge) => (
              <div
                key={badge.name}
                className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border"
              >
                <span className="text-lg">{badge.icon}</span>
                <div>
                  <div className="text-sm font-medium text-foreground">{badge.name}</div>
                  <div className="text-xs text-muted-foreground">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
