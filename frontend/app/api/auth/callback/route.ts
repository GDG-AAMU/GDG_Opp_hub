import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAAMUEmail } from '@/lib/validations/auth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    
    // Exchange code for session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('Session exchange error:', sessionError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }

    // Validate email domain
    const email = session?.user?.email
    if (email && !isAAMUEmail(email)) {
      // Sign out the user
      await supabase.auth.signOut()
      
      console.warn(`Rejected OAuth signup with invalid domain: ${email}`)
      return NextResponse.redirect(
        `${requestUrl.origin}/signup?error=invalid_domain&message=${encodeURIComponent('Only @aamu.edu and @bulldogs.aamu.edu emails are allowed')}`
      )
    }

    // Valid email - redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  }

  // No code, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
