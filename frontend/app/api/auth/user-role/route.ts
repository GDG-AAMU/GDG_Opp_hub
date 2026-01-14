import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/supabase/types"

type UserRole = Database["public"]["Tables"]["users"]["Row"]["role"]

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: UserRole }>()

    // If user record doesn't exist, create it and return default role
    if (userError) {
      // Check if it's a "not found" error
      if (userError.code === 'PGRST116' || userError.message?.includes('No rows')) {
        // User record doesn't exist - try to create it
        // Use upsert to handle race conditions
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || 'User',
            role: 'student'
          }, {
            onConflict: 'id'
          })
        
        if (insertError) {
          console.error('Error creating user record:', insertError)
          // If insert fails (e.g., duplicate email), try to fetch by email as fallback
          const { data: fallbackData } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email || '')
            .single<{ role: UserRole }>()
          
          if (fallbackData) {
            return NextResponse.json({
              role: fallbackData.role,
              isAdmin: fallbackData.role === 'admin'
            })
          }
        }
        
        // Return default student role
        return NextResponse.json({
          role: 'student',
          isAdmin: false
        })
      }
      
      // Other database errors
      console.error('Error fetching user role:', userError)
      return NextResponse.json(
        { error: "Failed to fetch user role" },
        { status: 500 }
      )
    }

    if (!userData) {
      // User record doesn't exist - create it with upsert
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || 'User',
          role: 'student'
        }, {
          onConflict: 'id'
        })
      
      if (insertError) {
        console.error('Error creating user record:', insertError)
        // If insert fails, try to fetch by email as fallback
        const { data: fallbackData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email || '')
          .single<{ role: UserRole }>()
        
        if (fallbackData) {
          return NextResponse.json({
            role: fallbackData.role,
            isAdmin: fallbackData.role === 'admin'
          })
        }
      }
      
      return NextResponse.json({
        role: 'student',
        isAdmin: false
      })
    }

    return NextResponse.json({
      role: userData.role,
      isAdmin: userData.role === 'admin'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

