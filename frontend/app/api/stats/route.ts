import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Use service role key to bypass RLS for public stats
    // This is safe because we're only returning counts, not sensitive data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json({
        newThisWeek: 0,
        deadlinesThisMonth: 0,
        activeListings: 0,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Calculate date ranges
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const thirtyDaysFromNow = new Date(now)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // Format dates for Supabase queries
    // For created_at (timestamp), use full ISO string
    const sevenDaysAgoISO = sevenDaysAgo.toISOString()
    // For deadline (date), use date string (YYYY-MM-DD)
    const nowDateStr = now.toISOString().split('T')[0]
    const thirtyDaysFromNowDateStr = thirtyDaysFromNow.toISOString().split('T')[0]

    // Fetch all three stats in parallel
    const [
      newThisWeekResult,
      deadlinesThisMonthResult,
      activeListingsResult,
    ] = await Promise.all([
      // New This Week: opportunities created in last 7 days with active status
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("created_at", sevenDaysAgoISO),
      
      // Deadlines This Month: opportunities with deadlines in next 30 days and active status
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .not("deadline", "is", null)
        .gte("deadline", nowDateStr)
        .lte("deadline", thirtyDaysFromNowDateStr),
      
      // Active Listings: all active opportunities
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ])

    // Handle errors gracefully
    if (newThisWeekResult.error) {
      console.error("Failed to fetch new this week count:", newThisWeekResult.error)
    }
    if (deadlinesThisMonthResult.error) {
      console.error("Failed to fetch deadlines this month count:", deadlinesThisMonthResult.error)
    }
    if (activeListingsResult.error) {
      console.error("Failed to fetch active listings count:", activeListingsResult.error)
    }

    return NextResponse.json({
      newThisWeek: newThisWeekResult.count || 0,
      deadlinesThisMonth: deadlinesThisMonthResult.count || 0,
      activeListings: activeListingsResult.count || 0,
    })
  } catch (error) {
    console.error("Stats API error:", error)
    // Return zeros on error so the page still renders
    return NextResponse.json({
      newThisWeek: 0,
      deadlinesThisMonth: 0,
      activeListings: 0,
    })
  }
}

