import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('email_notifications_enabled, daily_digest_enabled, deadline_reminders_enabled, daily_digest_time')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching notification preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({
      email_notifications_enabled: data?.email_notifications_enabled ?? true,
      daily_digest_enabled: data?.daily_digest_enabled ?? true,
      deadline_reminders_enabled: data?.deadline_reminders_enabled ?? true,
      daily_digest_time: data?.daily_digest_time ?? '18:00:00',
    })
  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email_notifications_enabled,
      daily_digest_enabled,
      deadline_reminders_enabled,
      daily_digest_time,
    } = body

    // Validate time format (HH:MM:SS or HH:MM)
    if (daily_digest_time && !/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(daily_digest_time)) {
      return NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
    }

    const updates: any = {}
    if (typeof email_notifications_enabled === 'boolean') {
      updates.email_notifications_enabled = email_notifications_enabled
    }
    if (typeof daily_digest_enabled === 'boolean') {
      updates.daily_digest_enabled = daily_digest_enabled
    }
    if (typeof deadline_reminders_enabled === 'boolean') {
      updates.deadline_reminders_enabled = deadline_reminders_enabled
    }
    if (daily_digest_time) {
      // Ensure time is in HH:MM:SS format
      const timeParts = daily_digest_time.split(':')
      if (timeParts.length === 2) {
        updates.daily_digest_time = `${daily_digest_time}:00`
      } else {
        updates.daily_digest_time = daily_digest_time
      }
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      console.error('Error updating notification preferences:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/notifications/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

