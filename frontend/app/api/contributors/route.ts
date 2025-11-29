import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'

// Tier thresholds
const getTier = (postCount: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
  if (postCount >= 20) return 'platinum'
  if (postCount >= 10) return 'gold'
  if (postCount >= 5) return 'silver'
  return 'bronze'
}

// Badge definitions
type BadgeType = 'first_post' | 'five_posts' | 'ten_posts' | 'twenty_posts' | 'early_adopter' | 'streak_week' | 'diverse_poster' | 'top_contributor'

interface Badge {
  id: BadgeType
  name: string
  description: string
  icon: string
}

const BADGES: Record<BadgeType, Badge> = {
  first_post: { id: 'first_post', name: 'First Steps', description: 'Posted first opportunity', icon: '🎯' },
  five_posts: { id: 'five_posts', name: 'Rising Star', description: 'Posted 5 opportunities', icon: '⭐' },
  ten_posts: { id: 'ten_posts', name: 'Dedicated', description: 'Posted 10 opportunities', icon: '🌟' },
  twenty_posts: { id: 'twenty_posts', name: 'Champion', description: 'Posted 20 opportunities', icon: '🏆' },
  early_adopter: { id: 'early_adopter', name: 'Early Adopter', description: 'Among first 10 contributors', icon: '🚀' },
  streak_week: { id: 'streak_week', name: 'On Fire', description: 'Posted 3+ times this week', icon: '🔥' },
  diverse_poster: { id: 'diverse_poster', name: 'Diverse', description: 'Posted 3+ different types', icon: '🌈' },
  top_contributor: { id: 'top_contributor', name: 'Top Contributor', description: 'Currently in top 3', icon: '👑' }
}

export interface Contributor {
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

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json({ contributors: [] })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get all opportunities with timestamps and types
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('submitted_by, created_at, opportunity_type')
      .order('created_at', { ascending: true })

    if (error) {
      console.error("Failed to fetch opportunities:", error)
      return NextResponse.json({ contributors: [] })
    }

    // Calculate date for "recent" posts (last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Build detailed stats per user
    const userStats = new Map<string, {
      postCount: number
      recentPosts: number
      firstPostDate: string | null
      types: Set<string>
    }>()

    for (const opp of opportunities || []) {
      if (!opp.submitted_by) continue

      const existing = userStats.get(opp.submitted_by) || {
        postCount: 0,
        recentPosts: 0,
        firstPostDate: null,
        types: new Set<string>()
      }

      existing.postCount++

      if (opp.created_at) {
        const postDate = new Date(opp.created_at)
        if (postDate >= oneWeekAgo) {
          existing.recentPosts++
        }
        if (!existing.firstPostDate) {
          existing.firstPostDate = opp.created_at
        }
      }

      if (opp.opportunity_type) {
        existing.types.add(opp.opportunity_type)
      }

      userStats.set(opp.submitted_by, existing)
    }

    // Sort by post count
    const sortedUserIds = Array.from(userStats.entries())
      .sort((a, b) => b[1].postCount - a[1].postCount)
      .map(([userId]) => userId)

    if (sortedUserIds.length === 0) {
      return NextResponse.json({ contributors: [] })
    }

    // Fetch user details
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', sortedUserIds)

    if (usersError) {
      console.error("Failed to fetch users:", usersError)
      return NextResponse.json({ contributors: [] })
    }

    // Build contributor list with badges
    const contributors: Contributor[] = sortedUserIds.map((userId, index) => {
      const user = users?.find(u => u.id === userId)
      const stats = userStats.get(userId)!
      const rank = index + 1

      // Calculate badges
      const badges: Badge[] = []

      if (stats.postCount >= 1) badges.push(BADGES.first_post)
      if (stats.postCount >= 5) badges.push(BADGES.five_posts)
      if (stats.postCount >= 10) badges.push(BADGES.ten_posts)
      if (stats.postCount >= 20) badges.push(BADGES.twenty_posts)
      if (rank <= 10) badges.push(BADGES.early_adopter)
      if (stats.recentPosts >= 3) badges.push(BADGES.streak_week)
      if (stats.types.size >= 3) badges.push(BADGES.diverse_poster)
      if (rank <= 3) badges.push(BADGES.top_contributor)

      return {
        id: userId,
        name: user?.name || 'Anonymous',
        avatar_url: user?.avatar_url || null,
        post_count: stats.postCount,
        recent_posts: stats.recentPosts,
        first_post_date: stats.firstPostDate,
        opportunity_types: Array.from(stats.types),
        tier: getTier(stats.postCount),
        badges,
        rank
      }
    })

    return NextResponse.json({ contributors })
  } catch (error) {
    console.error("Contributors API error:", error)
    return NextResponse.json({ contributors: [] })
  }
}
