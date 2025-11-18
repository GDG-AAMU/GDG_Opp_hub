import { createClient } from '@/lib/supabase/server'
import { sendEmail, generateDailyDigestEmail, generateDeadlineReminderEmail, generatePlainTextEmail, type Opportunity } from './service'

// Re-export Opportunity type for convenience
export type { Opportunity }

// Process pending emails from the queue
export async function processEmailQueue(batchSize: number = 10): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  let processed = 0
  let succeeded = 0
  let failed = 0

  try {
    const supabase = createClient()
    
    // Fetch pending emails scheduled for now or earlier
    const { data: queueItems, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(batchSize)

    if (fetchError) {
      console.error('Error fetching email queue:', fetchError)
      return { processed, succeeded, failed }
    }

    if (!queueItems || queueItems.length === 0) {
      return { processed, succeeded, failed }
    }

    // Process each email
    for (const item of queueItems) {
      processed++

      try {
        // Mark as processing
        await supabase
          .from('email_queue')
          .update({ status: 'processing' })
          .eq('id', item.id)

        // Get user details
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('email, name, email_notifications_enabled')
          .eq('id', item.user_id)
          .single()

        if (userError || !user) {
          throw new Error(`User not found: ${item.user_id}`)
        }

        // Check if user has notifications enabled
        if (!user.email_notifications_enabled) {
          // Mark as sent (skipped) and continue
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id)
          succeeded++
          continue
        }

        // Send email
        const result = await sendEmail(
          user.email,
          item.subject,
          item.html_content,
          item.text_content || undefined
        )

        if (result.success) {
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id)

          // Log the email
          await supabase.from('email_logs').insert({
            user_id: item.user_id,
            email_type: item.email_type,
            subject: item.subject,
            sent_at: new Date().toISOString(),
            resend_message_id: result.messageId,
            status: 'sent',
          })

          succeeded++
        } else {
          // Handle failure
          const retryCount = (item.retry_count || 0) + 1
          const maxRetries = item.max_retries || 3

          if (retryCount >= maxRetries) {
            // Mark as failed after max retries
            await supabase
              .from('email_queue')
              .update({
                status: 'failed',
                error_message: result.error || 'Max retries exceeded',
                processed_at: new Date().toISOString(),
              })
              .eq('id', item.id)
            failed++
          } else {
            // Retry later (exponential backoff: 5min, 15min, 45min)
            const backoffMinutes = Math.pow(3, retryCount) * 5
            const retryAt = new Date()
            retryAt.setMinutes(retryAt.getMinutes() + backoffMinutes)

            await supabase
              .from('email_queue')
              .update({
                status: 'pending',
                retry_count: retryCount,
                scheduled_for: retryAt.toISOString(),
              })
              .eq('id', item.id)
          }
        }
      } catch (error) {
        console.error(`Error processing email queue item ${item.id}:`, error)
        failed++

        // Mark as failed
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id)
      }
    }
  } catch (error) {
    console.error('Error processing email queue:', error)
  }

  return { processed, succeeded, failed }
}

// Add email to queue
export async function queueEmail(
  userId: string,
  emailType: 'daily_digest' | 'deadline_reminder',
  subject: string,
  htmlContent: string,
  textContent?: string,
  scheduledFor?: Date
): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    const supabase = createClient()
    const scheduledDate = scheduledFor || new Date()

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        user_id: userId,
        email_type: emailType,
        subject,
        html_content: htmlContent,
        text_content: textContent,
        scheduled_for: scheduledDate.toISOString(),
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error queueing email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, queueId: data.id }
  } catch (error) {
    console.error('Error queueing email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Queue daily digest for a user
export async function queueDailyDigest(
  userId: string,
  opportunities: Opportunity[],
  appUrl: string,
  scheduledFor?: Date
): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, daily_digest_enabled')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    if (!user.daily_digest_enabled) {
      return { success: false, error: 'Daily digest disabled for user' }
    }

    // Generate email content
    const htmlContent = generateDailyDigestEmail(user.name || 'User', opportunities, appUrl)
    const textContent = generatePlainTextEmail('daily_digest', user.name || 'User', opportunities, appUrl)
    const subject = `Your Daily Opportunities Digest - ${opportunities.length} New ${opportunities.length === 1 ? 'Opportunity' : 'Opportunities'}`

    // Queue the email
    return await queueEmail(userId, 'daily_digest', subject, htmlContent, textContent, scheduledFor)
  } catch (error) {
    console.error('Error queueing daily digest:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Queue deadline reminder for a user
export async function queueDeadlineReminder(
  userId: string,
  opportunities: Opportunity[],
  appUrl: string,
  scheduledFor?: Date
): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, deadline_reminders_enabled')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    if (!user.deadline_reminders_enabled) {
      return { success: false, error: 'Deadline reminders disabled for user' }
    }

    // Generate email content
    const htmlContent = generateDeadlineReminderEmail(user.name || 'User', opportunities, appUrl)
    const textContent = generatePlainTextEmail('deadline_reminder', user.name || 'User', opportunities, appUrl)
    const subject = `⏰ Deadline Reminder - ${opportunities.length} ${opportunities.length === 1 ? 'Opportunity' : 'Opportunities'} Ending Soon`

    // Queue the email
    return await queueEmail(userId, 'deadline_reminder', subject, htmlContent, textContent, scheduledFor)
  } catch (error) {
    console.error('Error queueing deadline reminder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

