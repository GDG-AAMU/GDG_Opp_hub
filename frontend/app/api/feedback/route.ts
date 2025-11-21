import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appendFeedbackToSheet } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get user - authentication required
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to submit feedback.' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const userName = profile?.name || user.email?.split('@')[0] || 'User'
    const userEmail = profile?.email || user.email || null

    const body = await request.json()
    const { feedback_type, subject, description, page_url } = body

    // Validation
    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject must be 200 characters or less' },
        { status: 400 }
      )
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be 2000 characters or less' },
        { status: 400 }
      )
    }

    const validTypes = ['bug', 'feature_request', 'general', 'other']
    if (feedback_type && !validTypes.includes(feedback_type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    // Insert feedback
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        feedback_type: feedback_type || 'general',
        subject: subject.trim(),
        description: description.trim(),
        page_url: page_url || null,
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting feedback:', error)
      return NextResponse.json(
        { error: 'Failed to submit feedback', details: error.message },
        { status: 500 }
      )
    }

    // Return success immediately
    const response = NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        id: data.id,
        status: data.status,
        created_at: data.created_at,
      },
    })

    // Sync to Google Sheets in background (fire and forget)
    // This runs after the response is sent, won't block the user
    setImmediate(() => {
      appendFeedbackToSheet({
        id: data.id,
        user_name: userName,
        user_email: userEmail,
        feedback_type: data.feedback_type,
        subject: data.subject,
        description: data.description,
        page_url: data.page_url,
        status: data.status,
        created_at: data.created_at || new Date().toISOString(),
      }).catch((err) => {
        console.error('Failed to sync feedback to Google Sheets:', err)
      })
    })

    return response
  } catch (error) {
    console.error('Error in POST /api/feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
