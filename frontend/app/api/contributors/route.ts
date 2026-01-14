import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'

// Tier is based on post count thresholds - users must EARN their tier
// This creates aspiration and meaningful progression
const getTierByPostCount = (postCount: number): 'bronze' | 'silver' | 'gold' | 'platinum' | null => {
  if (postCount >= 25) return 'platinum'  // Elite: 25+ posts
  if (postCount >= 10) return 'gold'      // Advanced: 10-24 posts
  if (postCount >= 5) return 'silver'     // Intermediate: 5-9 posts
  if (postCount >= 1) return 'bronze'     // Entry: 1-4 posts
  return null                              // No tier for 0 posts
}

// Badge definitions - meaningful badges with emoji icons
type BadgeType =
  // Milestone badges
  | 'first_post' | 'rising_star' | 'veteran' | 'legend' | 'champion'
  // Activity badges
  | 'hot_streak' | 'consistent' | 'weekend_warrior'
  // Special badges
  | 'pioneer' | 'explorer' | 'top_contributor' | 'helper'
  // Engagement badges
  | 'early_bird' | 'night_owl'

interface Badge {
  id: BadgeType
  name: string
  description: string
  icon: string
}

const BADGES: Record<BadgeType, Badge> = {
  // Milestone badges - based on total posts
  first_post: { id: 'first_post', name: 'First Post', description: 'Shared your first opportunity', icon: '🎯' },
  rising_star: { id: 'rising_star', name: 'Rising Star', description: 'Posted 5+ opportunities', icon: '⭐' },
  veteran: { id: 'veteran', name: 'Veteran', description: 'Posted 10+ opportunities', icon: '🌟' },
  legend: { id: 'legend', name: 'Legend', description: 'Posted 25+ opportunities', icon: '🏆' },
  champion: { id: 'champion', name: 'Champion', description: 'Posted 50+ opportunities', icon: '👑' },

  // Activity badges - based on recent activity
  hot_streak: { id: 'hot_streak', name: 'Hot Streak', description: 'Posted 2+ times this week', icon: '🔥' },
  consistent: { id: 'consistent', name: 'Consistent', description: 'Active for 3+ weeks', icon: '📈' },
  weekend_warrior: { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Posted on a weekend', icon: '🗓️' },

  // Special badges - based on rank/status
  pioneer: { id: 'pioneer', name: 'Pioneer', description: 'Among the first 10 contributors', icon: '🚀' },
  explorer: { id: 'explorer', name: 'Explorer', description: 'Posted 3+ different types', icon: '🌈' },
  top_contributor: { id: 'top_contributor', name: 'Top Contributor', description: 'Currently in top 3', icon: '💎' },
  helper: { id: 'helper', name: 'Helper', description: 'Shared 3+ job opportunities', icon: '💼' },

  // Time-based badges
  early_bird: { id: 'early_bird', name: 'Early Bird', description: 'Posted before 9 AM', icon: '🌅' },
  night_owl: { id: 'night_owl', name: 'Night Owl', description: 'Posted after 10 PM', icon: '🦉' },
}

export interface Contributor {
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

    // Fetch ALL users
    console.log("[Contributors API] Fetching users...")
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, avatar_url, created_at')
      .order('created_at', { ascending: true })

    if (usersError) {
      console.error("[Contributors API] Failed to fetch users:", usersError)
      return NextResponse.json({ contributors: [] })
    }

    console.log(`[Contributors API] Found ${allUsers?.length || 0} users`)
    if (allUsers && allUsers.length > 0) {
      console.log("[Contributors API] User IDs:", allUsers.map(u => ({ id: u.id, name: u.name })))
    }

    // Get all opportunities with timestamps and types
    console.log("[Contributors API] Fetching opportunities...")
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('submitted_by, created_at, opportunity_type')
      .order('created_at', { ascending: true })

    if (oppError) {
      console.error("[Contributors API] Failed to fetch opportunities:", oppError)
      console.error("[Contributors API] Error code:", oppError.code)
      console.error("[Contributors API] Error message:", oppError.message)
      console.error("[Contributors API] Full error:", JSON.stringify(oppError, null, 2))
      return NextResponse.json({ contributors: [] })
    }

    console.log(`[Contributors API] Found ${opportunities?.length || 0} opportunities`)
    if (opportunities && opportunities.length > 0) {
      console.log("[Contributors API] Sample opportunity:", opportunities[0])
      console.log("[Contributors API] All submitted_by values:", opportunities.map(o => o.submitted_by))
      console.log("[Contributors API] Unique submitted_by values:", [...new Set(opportunities.map(o => o.submitted_by))])
    } else {
      console.warn("[Contributors API] No opportunities found - this might be an RLS issue")
    }

    // Calculate date for "recent" posts (last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Build detailed stats per user
    console.log("[Contributors API] Building user stats...")
    const userStats = new Map<string, {
      postCount: number
      recentPosts: number
      firstPostDate: string | null
      types: Set<string>
      jobCount: number
      hasWeekendPost: boolean
      hasEarlyPost: boolean
      hasLatePost: boolean
      activeWeeks: Set<string>
    }>()

    const opportunitiesArray = opportunities || []
    console.log(`[Contributors API] Processing ${opportunitiesArray.length} opportunities`)

    for (const opp of opportunitiesArray) {
      if (!opp.submitted_by) {
        console.warn("[Contributors API] Opportunity missing submitted_by:", opp)
        continue
      }

      const existing = userStats.get(opp.submitted_by) || {
        postCount: 0,
        recentPosts: 0,
        firstPostDate: null,
        types: new Set<string>(),
        jobCount: 0,
        hasWeekendPost: false,
        hasEarlyPost: false,
        hasLatePost: false,
        activeWeeks: new Set<string>()
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

        // Track active weeks for consistency badge
        const weekKey = `${postDate.getFullYear()}-W${Math.ceil((postDate.getDate() + new Date(postDate.getFullYear(), postDate.getMonth(), 1).getDay()) / 7)}`
        existing.activeWeeks.add(weekKey)

        // Check for weekend posts (Saturday=6, Sunday=0)
        const dayOfWeek = postDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          existing.hasWeekendPost = true
        }

        // Check for early bird (before 9 AM) and night owl (after 10 PM)
        const hour = postDate.getHours()
        if (hour < 9) existing.hasEarlyPost = true
        if (hour >= 22) existing.hasLatePost = true
      }

      if (opp.opportunity_type) {
        existing.types.add(opp.opportunity_type)
        // Count job-related posts
        if (opp.opportunity_type.toLowerCase().includes('job') || opp.opportunity_type.toLowerCase().includes('internship')) {
          existing.jobCount++
        }
      }

      userStats.set(opp.submitted_by, existing)
    }

    console.log(`[Contributors API] User stats built for ${userStats.size} users`)
    console.log("[Contributors API] User stats:", Array.from(userStats.entries()).map(([id, stats]) => ({
      userId: id,
      postCount: stats.postCount
    })))

    // Build contributor list for ALL users
    console.log("[Contributors API] Building contributor list...")
    const contributors: Contributor[] = (allUsers || []).map((user) => {
      const stats = userStats.get(user.id)
      
      if (stats && stats.postCount > 0) {
        console.log(`[Contributors API] User ${user.name} (${user.id}) has ${stats.postCount} posts`)
      }

      return {
        id: user.id,
        name: user.name || 'Anonymous',
        avatar_url: user.avatar_url || null,
        post_count: stats?.postCount || 0,
        recent_posts: stats?.recentPosts || 0,
        first_post_date: stats?.firstPostDate || null,
        opportunity_types: stats ? Array.from(stats.types) : [],
        tier: null as 'bronze' | 'silver' | 'gold' | 'platinum' | null,
        badges: [] as Badge[],
        rank: null as number | null
      }
    })

    // Sort: users with posts first (by post count desc), tie-break by first_post_date (earlier = higher rank)
    // Then users without posts (by name)
    contributors.sort((a, b) => {
      if (a.post_count > 0 && b.post_count === 0) return -1
      if (a.post_count === 0 && b.post_count > 0) return 1
      if (a.post_count > 0 && b.post_count > 0) {
        // Primary: more posts = higher rank
        if (b.post_count !== a.post_count) {
          return b.post_count - a.post_count
        }
        // Tie-breaker: earlier first post = higher rank (got there first)
        if (a.first_post_date && b.first_post_date) {
          return new Date(a.first_post_date).getTime() - new Date(b.first_post_date).getTime()
        }
        return 0
      }
      // Both have 0 posts, sort by name
      return a.name.localeCompare(b.name)
    })

    // Assign ranks, tiers, and badges only to users with posts
    let currentRank = 1
    for (const contributor of contributors) {
      if (contributor.post_count > 0) {
        contributor.rank = currentRank
        contributor.tier = getTierByPostCount(contributor.post_count)

        // Get extended stats for this user
        const stats = userStats.get(contributor.id)

        // Calculate badges
        const badges: Badge[] = []

        // Milestone badges
        if (contributor.post_count >= 1) badges.push(BADGES.first_post)
        if (contributor.post_count >= 5) badges.push(BADGES.rising_star)
        if (contributor.post_count >= 10) badges.push(BADGES.veteran)
        if (contributor.post_count >= 25) badges.push(BADGES.legend)
        if (contributor.post_count >= 50) badges.push(BADGES.champion)

        // Activity badges
        if (contributor.recent_posts >= 2) badges.push(BADGES.hot_streak)
        if (stats && stats.activeWeeks.size >= 3) badges.push(BADGES.consistent)
        if (stats && stats.hasWeekendPost) badges.push(BADGES.weekend_warrior)

        // Special badges
        if (currentRank <= 10) badges.push(BADGES.pioneer)
        if (contributor.opportunity_types.length >= 3) badges.push(BADGES.explorer)
        if (currentRank <= 3) badges.push(BADGES.top_contributor)
        if (stats && stats.jobCount >= 3) badges.push(BADGES.helper)

        // Time-based badges
        if (stats && stats.hasEarlyPost) badges.push(BADGES.early_bird)
        if (stats && stats.hasLatePost) badges.push(BADGES.night_owl)

        contributor.badges = badges
        currentRank++
      }
    }

    const totalPosts = contributors.reduce((sum, c) => sum + c.post_count, 0)
    const activeContributors = contributors.filter(c => c.post_count > 0).length
    console.log(`[Contributors API] Final stats: ${activeContributors} contributors, ${totalPosts} total posts`)
    console.log("[Contributors API] Contributors with posts:", contributors.filter(c => c.post_count > 0).map(c => ({
      name: c.name,
      post_count: c.post_count
    })))

    return NextResponse.json({ contributors })
  } catch (error) {
    console.error("Contributors API error:", error)
    return NextResponse.json({ contributors: [] })
  }
}
