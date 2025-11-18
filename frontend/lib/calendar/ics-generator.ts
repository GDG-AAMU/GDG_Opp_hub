/**
 * Generate ICS (iCalendar) file content for opportunity deadlines
 */

interface Opportunity {
  id: string
  company_name: string
  job_title: string
  deadline: string
  location?: string | null
  url?: string | null
}

/**
 * Format date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Escape text for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Generate ICS file content for an opportunity deadline
 */
export function generateICSFile(opportunity: Opportunity): string {
  if (!opportunity.deadline) {
    throw new Error('Opportunity must have a deadline')
  }

  const deadline = new Date(opportunity.deadline)
  const start = formatICSDate(deadline)
  // Set end time to 1 hour after deadline
  const end = formatICSDate(new Date(deadline.getTime() + 3600000))
  const now = formatICSDate(new Date())

  const summary = `${opportunity.job_title} - ${opportunity.company_name}`
  const description = `Application deadline for ${opportunity.job_title} at ${opportunity.company_name}${opportunity.url ? `\\n\\nApply: ${opportunity.url}` : ''}`
  const location = opportunity.location || 'Remote'

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GDG Opportunities Hub//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${opportunity.id}@gdg-opportunities
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeICSText(summary)}
DESCRIPTION:${escapeICSText(description)}
LOCATION:${escapeICSText(location)}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`
}

/**
 * Download ICS file
 */
export function downloadICSFile(opportunity: Opportunity): void {
  try {
    const icsContent = generateICSFile(opportunity)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    // Sanitize filename
    const filename = `${opportunity.company_name.replace(/[^a-z0-9]/gi, '_')}-deadline.ics`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating ICS file:', error)
    throw error
  }
}

