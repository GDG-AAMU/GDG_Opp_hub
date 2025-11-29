'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Medal, Trophy, Crown } from 'lucide-react'

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
    label: 'Bronze'
  },
  silver: {
    icon: Medal,
    iconColor: 'text-gray-500 dark:text-gray-400',
    borderColor: 'border-gray-400/50',
    bgColor: 'bg-gray-50 dark:bg-gray-800/30',
    badgeBg: 'bg-gray-100 dark:bg-gray-800/50',
    label: 'Silver'
  },
  gold: {
    icon: Trophy,
    iconColor: 'text-yellow-500 dark:text-yellow-400',
    borderColor: 'border-yellow-500/50',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Gold'
  },
  platinum: {
    icon: Crown,
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/50',
    bgColor: 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Platinum'
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

export default function TopContributors() {
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

  // Don't render section if no contributors
  if (!isLoading && contributors.length === 0) {
    return null
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 text-foreground px-4"
        >
          Top Contributors
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto"
        >
          Recognizing our community members who help others discover opportunities
        </motion.p>

        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-4 sm:p-6 border border-border animate-pulse"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted mb-3" />
                  <div className="h-4 w-24 bg-muted rounded mb-2" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {contributors.map((contributor, index) => {
              const config = tierConfig[contributor.tier]
              const TierIcon = config.icon

              return (
                <motion.div
                  key={contributor.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: 'easeOut'
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.15)'
                  }}
                  className={`${config.bgColor} rounded-xl p-4 sm:p-6 border-2 ${config.borderColor} transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="relative mb-3">
                      {contributor.avatar_url ? (
                        <Image
                          src={contributor.avatar_url}
                          alt={contributor.name}
                          width={80}
                          height={80}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl border-2 border-white dark:border-gray-700 shadow-md">
                          {getInitials(contributor.name)}
                        </div>
                      )}
                      {/* Tier badge on avatar */}
                      <div className={`absolute -bottom-1 -right-1 ${config.badgeBg} rounded-full p-1.5 shadow-sm`}>
                        <TierIcon className={`w-4 h-4 ${config.iconColor}`} />
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-full">
                      {contributor.name}
                    </h3>

                    {/* Post count */}
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                      {contributor.post_count} {contributor.post_count === 1 ? 'post' : 'posts'}
                    </p>

                    {/* Tier label */}
                    <span className={`mt-2 px-2 py-0.5 ${config.badgeBg} ${config.iconColor} text-xs font-medium rounded-full`}>
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
  )
}
