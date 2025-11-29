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

export interface Contributor {
  id: string
  name: string
  avatar_url: string | null
  post_count: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export async function GET() {
  try {
    // Use service role key to bypass RLS for public stats
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

    // Get all opportunities with their submitters
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('submitted_by')

    if (error) {
      console.error("Failed to fetch opportunities:", error)
      return NextResponse.json({ contributors: [] })
    }

    // Count posts per user
    const postCounts = new Map<string, number>()
    for (const opp of opportunities || []) {
      if (opp.submitted_by) {
        postCounts.set(opp.submitted_by, (postCounts.get(opp.submitted_by) || 0) + 1)
      }
    }

    // Get user IDs with at least 1 post, sorted by count
    const sortedUserIds = Array.from(postCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId]) => userId)

    if (sortedUserIds.length === 0) {
      return NextResponse.json({ contributors: [] })
    }

    // Fetch user details for top contributors
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', sortedUserIds)

    if (usersError) {
      console.error("Failed to fetch users:", usersError)
      return NextResponse.json({ contributors: [] })
    }

    // Build contributor list with tier info
    const contributors: Contributor[] = sortedUserIds.map(userId => {
      const user = users?.find(u => u.id === userId)
      const postCount = postCounts.get(userId) || 0
      return {
        id: userId,
        name: user?.name || 'Anonymous',
        avatar_url: user?.avatar_url || null,
        post_count: postCount,
        tier: getTier(postCount)
      }
    })

    return NextResponse.json({ contributors })
  } catch (error) {
    console.error("Contributors API error:", error)
    return NextResponse.json({ contributors: [] })
  }
}
