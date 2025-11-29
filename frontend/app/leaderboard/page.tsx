'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Medal, Trophy, Crown, Users } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

interface Contributor {
  id: string
  name: string
  avatar_url: string | null
  post_count: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

const tierConfig = {
  bronze: {
    icon: Medal,
    iconColor: 'text-amber-600 dark:text-amber-500',
    borderColor: 'border-amber-500/50',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Bronze',
    description: '1-4 posts'
  },
  silver: {
    icon: Medal,
    iconColor: 'text-gray-500 dark:text-gray-400',
    borderColor: 'border-gray-400/50',
    bgColor: 'bg-gray-50 dark:bg-gray-800/30',
    badgeBg: 'bg-gray-100 dark:bg-gray-800/50',
    label: 'Silver',
    description: '5-9 posts'
  },
  gold: {
    icon: Trophy,
    iconColor: 'text-yellow-500 dark:text-yellow-400',
    borderColor: 'border-yellow-500/50',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Gold',
    description: '10-19 posts'
  },
  platinum: {
    icon: Crown,
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/50',
    bgColor: 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Platinum',
    description: '20+ posts'
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
              Leaderboard
            </h1>
            <p className="text-base sm:text-lg text-purple-200 dark:text-muted-foreground max-w-2xl mx-auto">
              Recognizing our amazing community members who help others discover opportunities
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tier Legend */}
      <section className="py-8 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {(['platinum', 'gold', 'silver', 'bronze'] as const).map((tier) => {
              const config = tierConfig[tier]
              const TierIcon = config.icon
              return (
                <div key={tier} className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${config.badgeBg}`}>
                    <TierIcon className={`w-4 h-4 ${config.iconColor}`} />
                  </div>
                  <span className="text-sm text-foreground font-medium">{config.label}</span>
                  <span className="text-xs text-muted-foreground">({config.description})</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contributors Grid */}
      <section className="flex-1 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 max-w-7xl mx-auto">
              {[...Array(10)].map((_, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-6 border border-border animate-pulse"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-muted mb-4" />
                    <div className="h-4 w-24 bg-muted rounded mb-2" />
                    <div className="h-3 w-16 bg-muted rounded mb-2" />
                    <div className="h-5 w-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : contributors.length === 0 ? (
            // Empty state
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No contributors yet</h3>
              <p className="text-muted-foreground">Be the first to post an opportunity and appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 max-w-7xl mx-auto">
              {contributors.map((contributor, index) => {
                const config = tierConfig[contributor.tier]
                const TierIcon = config.icon

                return (
                  <motion.div
                    key={contributor.id}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: 'easeOut'
                    }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: '0 10px 30px rgba(139, 92, 246, 0.15)'
                    }}
                    className={`${config.bgColor} rounded-xl p-6 border-2 ${config.borderColor} transition-all duration-300`}
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Rank badge for top 3 */}
                      {index < 3 && (
                        <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                        }`}>
                          {index + 1}
                        </div>
                      )}

                      {/* Avatar */}
                      <div className="relative mb-4">
                        {contributor.avatar_url ? (
                          <Image
                            src={contributor.avatar_url}
                            alt={contributor.name}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-xl border-2 border-white dark:border-gray-700 shadow-md">
                            {getInitials(contributor.name)}
                          </div>
                        )}
                        {/* Tier badge on avatar */}
                        <div className={`absolute -bottom-1 -right-1 ${config.badgeBg} rounded-full p-1.5 shadow-sm`}>
                          <TierIcon className={`w-4 h-4 ${config.iconColor}`} />
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className="font-semibold text-foreground text-base truncate max-w-full">
                        {contributor.name}
                      </h3>

                      {/* Post count */}
                      <p className="text-muted-foreground text-sm mt-1">
                        {contributor.post_count} {contributor.post_count === 1 ? 'post' : 'posts'}
                      </p>

                      {/* Tier label */}
                      <span className={`mt-3 px-3 py-1 ${config.badgeBg} ${config.iconColor} text-xs font-medium rounded-full`}>
                        {config.label}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
