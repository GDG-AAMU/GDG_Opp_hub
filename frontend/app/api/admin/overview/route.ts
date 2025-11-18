import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/supabase/types"

type UserRole = Database["public"]["Tables"]["users"]["Row"]["role"]

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single<{ role: UserRole }>()

    if (userError || !userData || userData.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    const [
      totalResult,
      activeResult,
      expiredResult,
      usersResult,
    ] = await Promise.all([
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "expired"),
      supabase.from("users").select("id", { count: "exact", head: true }),
    ])

    if (totalResult.error || activeResult.error || expiredResult.error) {
      console.error("Failed to calculate opportunity counts", {
        totalError: totalResult.error,
        activeError: activeResult.error,
        expiredError: expiredResult.error,
      })
      return NextResponse.json(
        { error: "Failed to calculate stats" },
        { status: 500 }
      )
    }

    const {
      data: recentData,
      error: recentError,
    } = await supabase
      .from("opportunities")
      .select(
        `
        *,
        users!submitted_by (
          name
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(10)

    if (recentError) {
      console.error("Failed to fetch recent submissions", recentError)
      return NextResponse.json(
        { error: "Failed to load recent submissions" },
        { status: 500 }
      )
    }

    if (usersResult.error) {
      console.warn("Failed to fetch total user count", usersResult.error)
    }

    return NextResponse.json({
      stats: {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        expired: expiredResult.count || 0,
        users: typeof usersResult.count === "number" ? usersResult.count : null,
      },
      recent: recentData || [],
    })
  } catch (error) {
    console.error("Admin overview API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
