import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Type definitions
export type EmailType = 'daily_digest' | 'deadline_reminder'

export interface Opportunity {
  id: string
  company_name: string
  job_title: string
  opportunity_type: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
  deadline: string | null
  location: string | null
  description: string | null
  url: string
}

export interface EmailQueueItem {
  id: string
  user_id: string
  email_type: EmailType
  subject: string
  html_content: string
  text_content?: string
  status: 'pending' | 'processing' | 'sent' | 'failed'
  scheduled_for: string
}

// Type badge colors
const typeColors = {
  internship: { bg: '#DBEAFE', text: '#1E40AF' },
  full_time: { bg: '#D1FAE5', text: '#065F46' },
  research: { bg: '#E9D5FF', text: '#6B21A8' },
  fellowship: { bg: '#FED7AA', text: '#9A3412' },
  scholarship: { bg: '#FCE7F3', text: '#9F1239' },
}

const typeLabels = {
  internship: 'Internship',
  full_time: 'Full-time',
  research: 'Research',
  fellowship: 'Fellowship',
  scholarship: 'Scholarship',
}

// Helper function to format date
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Helper function to format deadline
function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline'
  const date = new Date(deadline)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Expired'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 7) return `In ${diffDays} days`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Helper function to get deadline color
function getDeadlineColor(deadline: string | null): string {
  if (!deadline) return '#6B7280'
  const date = new Date(deadline)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return '#DC2626' // Red for expired
  if (diffDays <= 3) return '#DC2626' // Red for urgent
  if (diffDays <= 7) return '#F59E0B' // Orange for soon
  return '#6B7280' // Gray for normal
}

// Generate opportunity card HTML
function generateOpportunityCard(opportunity: Opportunity, appUrl: string): string {
  const typeColor = typeColors[opportunity.opportunity_type]
  const deadlineColor = getDeadlineColor(opportunity.deadline)
  const deadlineText = formatDeadline(opportunity.deadline)
  const viewDetailsUrl = `${appUrl}/opportunities/${opportunity.id}`

  let cardHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 8px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden;">
      <tr>
        <td style="padding: 0;">
          <!-- Desktop: Table Layout -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="desktop-layout" style="display: table; border-collapse: collapse;">
            <tr>
              <!-- Company Name Column -->
              <td style="padding: 10px 12px; border-right: 1px solid #E5E7EB; vertical-align: middle; width: 18%;" class="mobile-hide">
                <div style="margin: 0; padding: 0;">
                  <strong style="color: #111827; font-size: 14px; font-weight: 700; line-height: 1.3; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHtml(opportunity.company_name)}
                  </strong>
                </div>
              </td>
              <!-- Role Column -->
              <td style="padding: 10px 12px; border-right: 1px solid #E5E7EB; vertical-align: middle; width: 22%;" class="mobile-hide">
                <div style="margin: 0; padding: 0;">
                  <span style="color: #374151; font-size: 13px; font-weight: 500; line-height: 1.3; display: block; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(opportunity.job_title)}
                  </span>
                </div>
              </td>
              <!-- Date Column -->
              <td style="padding: 10px 12px; border-right: 1px solid #E5E7EB; vertical-align: middle; width: 18%;" class="mobile-hide">
                <div style="margin: 0; padding: 0;">
                  <span style="color: ${deadlineColor}; font-size: 12px; line-height: 1.3; display: block;">
                    📅 <strong>${deadlineText}</strong>
                  </span>
                </div>
              </td>
              <!-- Location Column -->
              <td style="padding: 10px 12px; border-right: 1px solid #E5E7EB; vertical-align: middle; width: 20%;" class="mobile-hide">
                <div style="margin: 0; padding: 0;">
                  <span style="color: #6B7280; font-size: 12px; line-height: 1.3; display: block; overflow: hidden; text-overflow: ellipsis;">
                    ${opportunity.location ? `📍 ${escapeHtml(opportunity.location)}` : '—'}
                  </span>
                </div>
              </td>
              <!-- Action Column -->
              <td style="padding: 10px 12px; vertical-align: middle; width: 22%; text-align: center;" class="mobile-hide">
                <div style="margin: 0; padding: 0;">
                  <a href="${viewDetailsUrl}" style="display: inline-block; padding: 6px 14px; background-color: #9333EA; color: #FFFFFF; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 12px; white-space: nowrap;">
                    View Details →
                  </a>
                </div>
              </td>
            </tr>
          </table>
          <!-- Mobile: Vertical Layout -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="mobile-layout" style="display: none;">
            <tr>
              <td style="padding: 12px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 0 0 8px 0;">
                      <strong style="color: #111827; font-size: 15px; font-weight: 700; line-height: 1.3; display: block;">
                        ${escapeHtml(opportunity.company_name)}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 0 6px 0;">
                      <span style="color: #374151; font-size: 14px; font-weight: 500; line-height: 1.3;">
                        ${escapeHtml(opportunity.job_title)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 0 6px 0;">
                      <span style="color: ${deadlineColor}; font-size: 12px;">
                        📅 <strong>${deadlineText}</strong>
                      </span>
                    </td>
                  </tr>
                  ${opportunity.location ? `
                  <tr>
                    <td style="padding: 0 0 8px 0;">
                      <span style="color: #6B7280; font-size: 12px;">
                        📍 ${escapeHtml(opportunity.location)}
                      </span>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0 0 0;">
                      <a href="${viewDetailsUrl}" style="display: inline-block; padding: 8px 16px; background-color: #9333EA; color: #FFFFFF; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 13px;">
                        View Details →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `

  return cardHtml
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Generate daily digest email HTML
export function generateDailyDigestEmail(
  userName: string,
  opportunities: Opportunity[],
  appUrl: string
): string {
  const date = formatDate(new Date())
  const managePreferencesUrl = `${appUrl}/settings?section=notifications`
  const unsubscribeUrl = `${appUrl}/unsubscribe?token=PLACEHOLDER`
  const viewAllUrl = `${appUrl}/dashboard`

  // Group opportunities by type
  const opportunitiesByType: Record<string, Opportunity[]> = {}
  opportunities.forEach((opp) => {
    const type = opp.opportunity_type
    if (!opportunitiesByType[type]) {
      opportunitiesByType[type] = []
    }
    opportunitiesByType[type].push(opp)
  })

  // Generate opportunities HTML grouped by type
  let opportunitiesHtml = ''
  Object.entries(opportunitiesByType).forEach(([type, opps]) => {
    const typeLabel = typeLabels[type as keyof typeof typeLabels]
    const typeColor = typeColors[type as keyof typeof typeColors]

    opportunitiesHtml += `
      <div style="margin-bottom: 16px;">
        <div style="background-color: ${typeColor.bg}; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px;">
          <h2 style="margin: 0; padding: 0; color: ${typeColor.text}; font-size: 14px; font-weight: 700;">
            ${typeLabel} (${opps.length})
          </h2>
        </div>
        <!-- Table Header (Desktop Only) -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="desktop-layout" style="display: table; border-collapse: collapse; margin-bottom: 4px; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px 6px 0 0;">
          <tr>
            <td style="padding: 8px 12px; border-right: 1px solid #E5E7EB; width: 18%;" class="mobile-hide">
              <strong style="color: #6B7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Company</strong>
            </td>
            <td style="padding: 8px 12px; border-right: 1px solid #E5E7EB; width: 22%;" class="mobile-hide">
              <strong style="color: #6B7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Role</strong>
            </td>
            <td style="padding: 8px 12px; border-right: 1px solid #E5E7EB; width: 18%;" class="mobile-hide">
              <strong style="color: #6B7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Deadline</strong>
            </td>
            <td style="padding: 8px 12px; border-right: 1px solid #E5E7EB; width: 20%;" class="mobile-hide">
              <strong style="color: #6B7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Location</strong>
            </td>
            <td style="padding: 8px 12px; width: 22%; text-align: center;" class="mobile-hide">
              <strong style="color: #6B7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Action</strong>
            </td>
          </tr>
        </table>
    `

    opps.forEach((opp) => {
      opportunitiesHtml += generateOpportunityCard(opp, appUrl)
    })

    opportunitiesHtml += `</div>`
  })

  // Load and replace template
  const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Opportunities Digest</title>
  <style>
    @media only screen and (max-width: 600px) {
      .desktop-layout {
        display: none !important;
      }
      .mobile-layout {
        display: table !important;
      }
      .mobile-hide {
        display: none !important;
      }
    }
    @media only screen and (min-width: 601px) {
      .mobile-layout {
        display: none !important;
      }
      .desktop-layout {
        display: table !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB;">
    <tr>
      <td align="center" style="padding: 10px 5px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 98%; width: 100%; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #9333EA 0%, #7C3AED 50%, #3B82F6 100%); padding: 24px 20px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <img src="${appUrl}/GDG%20Logo.png" alt="GDG Logo" width="120" height="auto" style="display: block; margin: 0 auto; max-width: 120px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700; line-height: 1.3;">
                      GDG Opportunities Hub
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <p style="margin: 0; color: #FFFFFF; font-size: 15px; opacity: 0.95;">
                      Your Daily Opportunities Digest
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 4px;">
                    <p style="margin: 0; color: #FFFFFF; font-size: 13px; opacity: 0.9;">
                      ${date}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 14px;">
              <p style="margin: 0 0 10px 0; padding: 0; color: #111827; font-size: 15px; line-height: 1.5;">
                Hi ${escapeHtml(userName)},
              </p>
              <p style="margin: 0 0 16px 0; padding: 0; color: #374151; font-size: 14px; line-height: 1.5;">
                Here are new opportunities matching your interests from the last 24 hours.
              </p>
              ${opportunitiesHtml}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 16px;">
                <tr>
                  <td>
                    <a href="${viewAllUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #9333EA 0%, #3B82F6 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);">
                      View All Opportunities
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 16px 14px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 6px 0; padding: 0; color: #111827; font-size: 15px; font-weight: 600;">
                GDG Opportunities Hub
              </p>
              <p style="margin: 0 0 12px 0; padding: 0; color: #6B7280; font-size: 13px; line-height: 1.5;">
                Connecting students with opportunities
              </p>
              <p style="margin: 0; padding: 0; color: #9CA3AF; font-size: 11px; line-height: 1.5;">
                <a href="${managePreferencesUrl}" style="color: #9333EA; text-decoration: none;">Manage Preferences</a>
                <span style="color: #D1D5DB;"> | </span>
                <a href="${unsubscribeUrl}" style="color: #9333EA; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return template
}

// Generate deadline reminder email HTML
export function generateDeadlineReminderEmail(
  userName: string,
  opportunities: Opportunity[],
  appUrl: string
): string {
  const managePreferencesUrl = `${appUrl}/settings?section=notifications`
  const unsubscribeUrl = `${appUrl}/unsubscribe?token=PLACEHOLDER`
  const viewAllUrl = `${appUrl}/dashboard`

  // Generate opportunities HTML
  let opportunitiesHtml = ''
  opportunities.forEach((opp) => {
    opportunitiesHtml += generateOpportunityCard(opp, appUrl)
  })

  const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deadline Reminder</title>
  <style>
    @media only screen and (max-width: 600px) {
      .desktop-layout {
        display: none !important;
      }
      .mobile-layout {
        display: table !important;
      }
      .mobile-hide {
        display: none !important;
      }
    }
    @media only screen and (min-width: 601px) {
      .mobile-layout {
        display: none !important;
      }
      .desktop-layout {
        display: table !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB;">
    <tr>
      <td align="center" style="padding: 10px 5px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 98%; width: 100%; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%); padding: 24px 20px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <img src="${appUrl}/GDG%20Logo.png" alt="GDG Logo" width="120" height="auto" style="display: block; margin: 0 auto; max-width: 120px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700; line-height: 1.3;">
                      Deadline Reminder
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <p style="margin: 0; color: #FFFFFF; font-size: 15px; opacity: 0.95;">
                      Don't miss these opportunities!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 14px;">
              <p style="margin: 0 0 10px 0; padding: 0; color: #111827; font-size: 15px; line-height: 1.5;">
                Hi ${escapeHtml(userName)},
              </p>
              <p style="margin: 0 0 16px 0; padding: 0; color: #374151; font-size: 14px; line-height: 1.5;">
                These opportunities have deadlines approaching soon. Make sure to apply before it's too late!
              </p>
              ${opportunitiesHtml}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 16px;">
                <tr>
                  <td>
                    <a href="${viewAllUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                      View All Opportunities
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 16px 14px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 6px 0; padding: 0; color: #111827; font-size: 15px; font-weight: 600;">
                GDG Opportunities Hub
              </p>
              <p style="margin: 0 0 12px 0; padding: 0; color: #6B7280; font-size: 13px; line-height: 1.5;">
                Connecting students with opportunities
              </p>
              <p style="margin: 0; padding: 0; color: #9CA3AF; font-size: 11px; line-height: 1.5;">
                <a href="${managePreferencesUrl}" style="color: #9333EA; text-decoration: none;">Manage Preferences</a>
                <span style="color: #D1D5DB;"> | </span>
                <a href="${unsubscribeUrl}" style="color: #9333EA; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return template
}

// Generate plain text version
export function generatePlainTextEmail(
  emailType: EmailType,
  userName: string,
  opportunities: Opportunity[],
  appUrl: string
): string {
  const date = formatDate(new Date())
  const viewAllUrl = `${appUrl}/dashboard`

  let text = ''
  if (emailType === 'daily_digest') {
    text = `GDG Opportunities Hub - Daily Digest\n`
    text += `${date}\n\n`
    text += `Hi ${userName},\n\n`
    text += `Here are new opportunities matching your interests from the last 24 hours:\n\n`
  } else {
    text = `GDG Opportunities Hub - Deadline Reminder\n\n`
    text += `Hi ${userName},\n\n`
    text += `These opportunities have deadlines approaching soon:\n\n`
  }

  opportunities.forEach((opp, index) => {
    text += `${index + 1}. ${opp.company_name} - ${opp.job_title}\n`
    text += `   Type: ${typeLabels[opp.opportunity_type]}\n`
    if (opp.deadline) {
      text += `   Deadline: ${formatDeadline(opp.deadline)}\n`
    }
    if (opp.location) {
      text += `   Location: ${opp.location}\n`
    }
    text += `   View: ${appUrl}/opportunities/${opp.id}\n\n`
  })

  text += `View all opportunities: ${viewAllUrl}\n\n`
  text += `Manage preferences: ${appUrl}/settings?section=notifications\n`

  return text
}

// Send email using Resend
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com'
    const fromName = process.env.RESEND_FROM_NAME || 'GDG Opportunities Hub'

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
      text: text || generatePlainTextFromHtml(html),
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Helper to generate plain text from HTML (simple version)
function generatePlainTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
}

